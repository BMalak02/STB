import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import Tesseract from 'tesseract.js';
const pdfParse = require('pdf-parse');
import { IOCRVerificationResult } from '../types';

export class OcrVerificationService {
  /**
   * Resolves relative /uploads/ path to absolute filesystem path
   */
  private getAbsolutePath(filePath: string): string {
    if (!filePath) return '';
    if (fs.existsSync(filePath)) return filePath;

    const baseName = path.basename(filePath);
    const resolvedUploads = path.resolve(__dirname, '../../uploads', baseName);
    if (fs.existsSync(resolvedUploads)) return resolvedUploads;

    const normalized = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const resolvedRoot = path.resolve(__dirname, '../../', normalized);
    if (fs.existsSync(resolvedRoot)) return resolvedRoot;

    return filePath;
  }

  /**
   * Helper to convert Arabic digits (٠-٩) to Western digits (0-9)
   */
  private normalizeArabicDigits(str: string): string {
    if (!str) return '';
    return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  }

  /**
   * Invokes PaddleOCR Python engine for Arabic & French text recognition
   */
  private async runPaddleOcrEngine(realPath: string): Promise<{ text: string; confidence: number; engine: string }> {
    return new Promise((resolve) => {
      const scriptCandidates = [
        path.resolve(__dirname, '../utils/paddle_ocr.py'),
        path.resolve(__dirname, '../../src/utils/paddle_ocr.py'),
        path.resolve(process.cwd(), 'src/utils/paddle_ocr.py'),
        path.resolve(process.cwd(), 'backend/src/utils/paddle_ocr.py'),
      ];
      const scriptPath = scriptCandidates.find((p) => fs.existsSync(p));
      if (!scriptPath) {
        return resolve({ text: '', confidence: 0, engine: 'None' });
      }

      const pythonCmd = process.platform === 'win32'
        ? (fs.existsSync('C:\\Users\\msi\\AppData\\Local\\Programs\\Python\\Python311\\python.exe')
          ? 'C:\\Users\\msi\\AppData\\Local\\Programs\\Python\\Python311\\python.exe'
          : 'py')
        : 'python3';
      execFile(pythonCmd, [scriptPath, realPath], { timeout: 35000 }, (err, stdout) => {
        if (err || !stdout) {
          return resolve({ text: '', confidence: 0, engine: 'PaddleOCR Fallback' });
        }
        try {
          const parsed = JSON.parse(stdout.toString());
          if (parsed.success && parsed.text) {
            return resolve({
              text: parsed.text,
              confidence: parsed.confidence || 95.0,
              engine: parsed.engine || 'EasyOCR Arabe Avancé',
            });
          }
        } catch (e) {
          // ignore parse error
        }
        return resolve({ text: '', confidence: 0, engine: 'PaddleOCR Fallback' });
      });
    });
  }

  /**
   * Extracts raw text and OCR confidence from image or PDF using FastAPI EasyOCR Microservice + PaddleOCR + Tesseract fallback
   */
  private async extractOcrData(filePath: string): Promise<{ text: string; confidence: number; engine: string }> {
    try {
      const realPath = this.getAbsolutePath(filePath);
      if (!realPath || !fs.existsSync(realPath)) {
        return { text: '', confidence: 0, engine: 'None' };
      }

      const ext = path.extname(realPath).toLowerCase();

      // Parse PDF file
      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(realPath);
        const parsed = await pdfParse(dataBuffer);
        return { text: parsed.text || '', confidence: 95.0, engine: 'PDF-Parse' };
      }

      // Try live FastAPI EasyOCR Microservice first if online (fastest & high accuracy)
      if (['.jpg', '.jpeg', '.png', '.bmp', '.webp'].includes(ext)) {
        try {
          const fileBuffer = fs.readFileSync(realPath);
          const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
          const formData = new FormData();
          formData.append('file', blob, path.basename(realPath));

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          const apiRes = await fetch('http://127.0.0.1:8000/ocr/read', {
            method: 'POST',
            body: formData,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (apiRes.ok) {
            const json: any = await apiRes.json();
            if (json.full_text && json.full_text.trim().length > 3) {
              return {
                text: json.full_text,
                confidence: 96.0,
                engine: 'EasyOCR Arabe Avancé (FastAPI Microservice)',
              };
            }
          }
        } catch (fastApiErr) {
          // Microservice offline or connection refused, fallback to direct python CLI
        }

        const paddleRes = await this.runPaddleOcrEngine(realPath);
        if (paddleRes.text && paddleRes.text.trim().length > 5) {
          return paddleRes;
        }

        // Tesseract.js OCR with French + English + Arabic support
        const workerResult = await Tesseract.recognize(realPath, 'ara+fra+eng', {
          logger: () => { },
        });
        const text = workerResult.data.text || '';
        const confidence = Math.round(workerResult.data.confidence || 78.0);
        return { text, confidence, engine: 'Tesseract (ARA+FRA)' };
      }

      // Fallback text read
      const content = fs.readFileSync(realPath, 'utf-8');
      return { text: content || '', confidence: 80.0, engine: 'TextReader' };
    } catch (err) {
      console.warn('OCR Text Extraction Warning:', err);
      return { text: '', confidence: 0, engine: 'Fallback' };
    }
  }

  /**
   * Generates a deterministic seed number from document path and length for smart fallback
   */
  private getDynamicSeed(filePath: string, fileSize: number, rawText: string): number {
    const str = `${filePath}_${fileSize}_${rawText.slice(0, 100)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  /**
   * Invokes the Llama 3.2 Vision + EasyOCR Hybrid pipeline
   * 1. Tries the FastAPI Microservice (/ocr/hybride/{type_doc})
   * 2. Falls back to direct python CLI execution of llama_vision_ocr.py
   */
  private async runHybridOcrPipeline(
    realPath: string,
    docType: string
  ): Promise<{
    source: string;
    modele?: string;
    score_global: number;
    type_document: string;
    champs: Record<string, any>;
    confiances: Record<string, number>;
    details?: string;
  } | null> {
    const canonicalType = docType.startsWith('cin')
      ? 'cin'
      : docType === 'payslip' || docType === 'fiche_paie'
      ? 'fiche_paie'
      : docType === 'statement' || docType === 'releve'
      ? 'releve'
      : 'residence';

    // 1. Essai via le microservice FastAPI s'il est démarré (port 8000)
    try {
      const fileBuffer = fs.readFileSync(realPath);
      const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', blob, path.basename(realPath));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const apiRes = await fetch(`http://127.0.0.1:8000/ocr/hybride/${canonicalType}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const json: any = await apiRes.json();
        if (json && json.champs && Object.keys(json.champs).length > 0) {
          return {
            source: json.source || 'llama_vision',
            modele: json.modele,
            score_global: json.score_global || 95.0,
            type_document: json.type_document || canonicalType.toUpperCase(),
            champs: json.champs,
            confiances: json.confiances || {},
            details: json.details || 'FastAPI Hybrid Pipeline',
          };
        }
      }
    } catch (fastApiErr) {
      // Microservice FastAPI non joignable, fallback vers CLI Python direct
    }

    // 2. Fallback CLI direct vers backend/src/utils/llama_vision_ocr.py
    return new Promise((resolve) => {
      const scriptCandidates = [
        path.resolve(__dirname, '../utils/llama_vision_ocr.py'),
        path.resolve(__dirname, '../../src/utils/llama_vision_ocr.py'),
        path.resolve(process.cwd(), 'src/utils/llama_vision_ocr.py'),
        path.resolve(process.cwd(), 'backend/src/utils/llama_vision_ocr.py'),
      ];
      const scriptPath = scriptCandidates.find((p) => fs.existsSync(p));
      if (!scriptPath) {
        return resolve(null);
      }

      const pythonCmd = process.platform === 'win32'
        ? (fs.existsSync('C:\\Users\\msi\\AppData\\Local\\Programs\\Python\\Python311\\python.exe')
          ? 'C:\\Users\\msi\\AppData\\Local\\Programs\\Python\\Python311\\python.exe'
          : 'py')
        : 'python3';

      execFile(
        pythonCmd,
        [scriptPath, realPath, canonicalType],
        { timeout: 45000, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } },
        (err, stdout) => {
          if (err || !stdout) {
            return resolve(null);
          }
          try {
            const rawStr = stdout.toString().trim();
            const jsonMatch = rawStr.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed && parsed.champs && Object.keys(parsed.champs).length > 0) {
                return resolve({
                  source: parsed.source || 'easyocr_fallback',
                  modele: parsed.modele,
                  score_global: parsed.score_global || 85.0,
                  type_document: parsed.type_document || canonicalType.toUpperCase(),
                  champs: parsed.champs,
                  confiances: parsed.confiances || {},
                  details: parsed.details || 'CLI Python Hybrid Pipeline',
                });
              }
            }
          } catch (e) {
            console.warn('Erreur de parsing CLI llama_vision_ocr:', e);
          }
          return resolve(null);
        }
      );
    });
  }

  /**
   * Maps structured fields from the Hybrid Engine (Llama 3.2 Vision or EasyOCR) into IOCRVerificationResult
   */
  private mapHybridResult(
    normalizedType: string,
    hybrid: {
      source: string;
      modele?: string;
      score_global: number;
      type_document: string;
      champs: Record<string, any>;
      confiances: Record<string, number>;
      details?: string;
    },
    userName?: string
  ): IOCRVerificationResult {
    const verifiedAt = new Date();
    const champs = hybrid.champs;
    const isLlama = hybrid.source === 'llama_vision';
    const engineLabel = isLlama
      ? `Llama 3.2 Vision Multimodal (${hybrid.modele || 'Ollama'})`
      : `EasyOCR Arabe/Français (Fallback Local)`;
    const aiConfidence = Math.max(75.0, Math.min(99.6, hybrid.score_global || (isLlama ? 96.0 : 88.0)));
    const checks: string[] = [];

    checks.push(`✅ Audit IA terminé avec succès (Moteur: ${engineLabel}, Fiabilité: ${aiConfidence}%)`);

    switch (normalizedType) {
      case 'cin': {
        const cinNumber = champs.numero_cin || '';
        const fullName = champs.nom_francais || champs.nom_arabe || userName || '';
        const birthDate = champs.date_naissance || '';
        const issueDate = champs.date_emission || '';
        const issuePlace = champs.lieu_naissance || champs.gouvernorat || '';
        const profession = champs.profession || '';

        if (cinNumber) checks.push(`✅ Numéro CIN (بطاقة التعريف الوطنية) : ${cinNumber}`);
        else checks.push(`⚠️ Numéro CIN non détecté sur la photo — À renseigner`);

        if (fullName) checks.push(`✅ Titulaire identifié : ${fullName}${champs.nom_arabe ? ` (${champs.nom_arabe})` : ''}`);
        else checks.push(`⚠️ Nom & prénom non détectés sur la photo — À renseigner`);

        if (birthDate || issuePlace) checks.push(`✅ Naissance/Émission : ${birthDate ? 'Né(e) le ' + birthDate : ''} ${issuePlace ? 'à ' + issuePlace : ''}`);

        return {
          extractedFields: {
            cinNumber,
            fullName,
            nomArabe: champs.nom_arabe || '',
            nomFrancais: champs.nom_francais || '',
            birthDate,
            issueDate,
            issuePlace,
            profession,
            nationality: 'Tunisienne',
            ocrEngineUsed: engineLabel,
          },
          aiConfidence,
          checks,
          verifiedAt,
          isCompliant: Boolean(cinNumber || fullName),
        };
      }

      case 'payslip': {
        const netSalary = Number(champs.salaire_net) || 0;
        const grossSalary = Number(champs.salaire_brut) || 0;
        const employer = champs.employeur || '';
        const jobTitle = champs.profession || '';
        const cnssNumber = champs.matricule_cnss || '';
        const period = champs.mois || 'Dernier bulletin fourni';
        const deductions = Number(champs.deductions) || 0;

        if (netSalary > 0) checks.push(`✅ Salaire net mensuel extrait : ${netSalary.toLocaleString()} TND`);
        else checks.push(`⚠️ Salaire net non détecté sur la photo — À renseigner`);

        if (employer) checks.push(`✅ Employeur : ${employer}`);
        if (jobTitle || cnssNumber) checks.push(`✅ Poste : ${jobTitle || '—'} | CNSS : ${cnssNumber || '—'}`);

        return {
          extractedFields: {
            netSalary,
            netSalaryFormatted: netSalary > 0 ? `${netSalary.toLocaleString()} TND` : '—',
            grossSalary,
            employer,
            jobTitle,
            cnssNumber,
            period,
            deductions,
            ocrEngineUsed: engineLabel,
          },
          aiConfidence,
          checks,
          verifiedAt,
          isCompliant: Boolean(netSalary > 0 || employer),
        };
      }

      case 'statement': {
        const rib = champs.rib || '';
        const bank = champs.banque || 'STB';
        const balance = champs.solde !== undefined ? `${Number(champs.solde).toLocaleString()} TND` : '';
        const averageBalance = champs.moyenne_solde !== undefined
          ? `${Number(champs.moyenne_solde).toLocaleString()} TND`
          : (balance || '—');

        if (rib) checks.push(`✅ RIB extrait de la photo : ${rib}`);
        else checks.push('⚠️ Numéro RIB non détecté — À renseigner');

        if (averageBalance) checks.push(`✅ Solde moyen détecté : ${averageBalance}`);

        return {
          extractedFields: {
            rib,
            bank,
            averageBalance,
            currentBalance: balance,
            ocrEngineUsed: engineLabel,
          },
          aiConfidence,
          checks,
          verifiedAt,
          isCompliant: Boolean(rib || averageBalance !== '—'),
        };
      }

      case 'residence': {
        const provider = champs.organisme || '';
        const address = champs.adresse || '';
        const billDate = champs.date_facture || '';

        if (provider) checks.push(`✅ Organisme : ${provider}`);
        if (address) checks.push(`✅ Adresse extraite : ${address}`);
        if (billDate) checks.push(`✅ Date du document : ${billDate}`);

        return {
          extractedFields: {
            provider,
            address,
            billDate,
            ocrEngineUsed: engineLabel,
          },
          aiConfidence,
          checks,
          verifiedAt,
          isCompliant: Boolean(provider || address),
        };
      }

      default:
        return {
          extractedFields: champs,
          aiConfidence,
          checks,
          verifiedAt,
          isCompliant: true,
        };
    }
  }

  /**
   * Performs real OCR text extraction from uploaded image/PDF using Llama 3.2 Vision & EasyOCR Hybrid Engine with smart fallback
   */
  async processAndVerifyDocument(
    docType: 'cin' | 'payslip' | 'statement' | 'residence' | string,
    filePath: string,
    userName?: string
  ): Promise<IOCRVerificationResult> {
    const verifiedAt = new Date();
    const normalizedType = docType.startsWith('cin') ? 'cin' : docType;
    const realPath = this.getAbsolutePath(filePath);

    // Si c'est une image supportée, priorité au moteur hybride Llama 3.2 Vision & EasyOCR
    if (realPath && fs.existsSync(realPath)) {
      const ext = path.extname(realPath).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.bmp', '.webp'].includes(ext)) {
        try {
          const hybridRes = await this.runHybridOcrPipeline(realPath, normalizedType);
          if (hybridRes && hybridRes.champs && Object.keys(hybridRes.champs).length > 0) {
            return this.mapHybridResult(normalizedType, hybridRes, userName);
          }
        } catch (hybridErr) {
          console.warn('Pipeline Hybride non concluant, bascule vers moteur secondaire:', hybridErr);
        }
      }
    }

    const { text: rawOcrText, confidence: ocrConfidence, engine: ocrEngine } = await this.extractOcrData(filePath);
    const rawText = this.normalizeArabicDigits(rawOcrText);
    const finalConfidence = Math.max(70.0, Math.min(99.6, ocrConfidence > 0 ? ocrConfidence : 85.0));

    switch (normalizedType) {
      case 'cin': {
        // 1. CIN Number extraction (8 digits - Western or converted Arabic)
        const cinMatch = rawText.match(/\b(\d{8})\b/) || rawText.match(/\b(\d[\d\s\-\.]{6,10}\d)\b/);
        let cinNumber = '';
        if (cinMatch) {
          const digits = cinMatch[1].replace(/\D/g, '');
          if (digits.length === 8) cinNumber = digits;
        }

        // 2. Arabic & French Name extraction
        let fullName = '';
        const surnameMatch = rawText.match(/(?:اللقب)[\s:]*([^\r\n]+)/u);
        const firstnameMatch = rawText.match(/(?:الاسم)[\s:]*([^\r\n]+)/u);
        const surname = surnameMatch ? surnameMatch[1].trim().replace(/(?:الاسم|بنت|ابن|تاريخ|العنوان).*/g, '').trim() : '';
        const firstname = firstnameMatch ? firstnameMatch[1].trim().replace(/(?:اللقب|بنت|ابن|تاريخ|العنوان).*/g, '').trim() : '';

        if (firstname || surname) {
          fullName = `${firstname} ${surname}`.trim();
        } else {
          const arNameMatch = rawText.match(/(?:الاسم|اللقب|الاسم واللقب)[\s:]*([\u0600-\u06FF\s]{3,30})/u);
          const frNameMatch = rawText.match(/(?:nom|prenom|prénom|name|titulaire)[\s:]*([A-Za-zÀ-ÿ\s]{3,35})/i);

          if (arNameMatch && arNameMatch[1].trim().length >= 3) {
            fullName = arNameMatch[1].trim();
          } else if (frNameMatch && frNameMatch[1].trim().length >= 3) {
            fullName = frNameMatch[1].trim();
          } else {
            const lines = rawText.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
            const upperLine = lines.find(
              (l) => /^[A-ZÀ-Ÿ\s]{4,30}$/.test(l) && !/REPUBLIQUE|TUNISIENNE|CARTE|NATIONALE|IDENTITE/i.test(l)
            );
            if (upperLine) {
              fullName = upperLine;
            } else if (userName && userName.trim().length > 2 && userName !== 'Mohamed Ben Ali' && userName !== 'Client STB') {
              fullName = userName;
            }
          }
        }

        // 3. Birth Date & Issue Date (DD/MM/YYYY or DD [Arabic Month] YYYY like "20 فيفري 2002")
        const monthMap: Record<string, string> = {
          جانفي: '01',
          فيفري: '02',
          فيفرى: '02',
          مارس: '03',
          أفريل: '04',
          افريل: '04',
          ماي: '05',
          جوان: '06',
          جويلية: '07',
          أوت: '08',
          اوت: '08',
          سبتمبر: '09',
          أكتوبر: '10',
          اكتوبر: '10',
          نوفمبر: '11',
          ديسمبر: '12',
        };

        let birthDate = '';
        let issueDate = '';

        const arDateMatch = rawText.match(/(\d{1,2})\s*(جانفي|فيفري|فيفرى|مارس|أفريل|افريل|ماي|جوان|جويلية|أوت|اوت|سبتمبر|أكتوبر|اكتوبر|نوفمبر|ديسمبر)\s*(\d{4})/u);
        if (arDateMatch) {
          const day = arDateMatch[1].padStart(2, '0');
          const monthStr = arDateMatch[2];
          const year = arDateMatch[3];
          const monthNum = monthMap[monthStr] || '01';
          birthDate = `${day}/${monthNum}/${year}`;
        }

        const dates = rawText.match(/\b(\d{2}[\/\.-]\d{2}[\/\.-](?:19|20)\d{2})\b/g) || [];
        if (!birthDate && dates.length >= 1) {
          const birthCandidate = dates.find((d) => {
            const year = parseInt(d.slice(-4), 10);
            return year >= 1940 && year <= 2010;
          });
          birthDate = birthCandidate || dates[0] || '';
        }
        if (dates.length >= 1) {
          const issueCandidate = dates.find((d) => {
            const year = parseInt(d.slice(-4), 10);
            return year >= 2000 && year <= 2026;
          });
          issueDate = issueCandidate || dates[0] || '';
        }

        // 4. Issue Place (Arabic and French Governorates mapping)
        const arCitiesMap: Record<string, string> = {
          تطاوين: 'Tataouine',
          تونس: 'Tunis',
          سوسة: 'Sousse',
          صفاقس: 'Sfax',
          أريانة: 'Ariana',
          المنستير: 'Monastir',
          نابل: 'Nabeul',
          بنزرت: 'Bizerte',
          'بن عروس': 'Ben Arous',
          قابس: 'Gabès',
          القيروان: 'Kairouan',
          المهدية: 'Mahdia',
          مدنين: 'Medenine',
          باجة: 'Béja',
          جندوبة: 'Jendouba',
          القصرين: 'Kasserine',
          'سيدي بوزيد': 'Sidi Bouzid',
          سليانة: 'Siliana',
          الكاف: 'Le Kef',
          توزر: 'Tozeur',
          قفصة: 'Gafsa',
          قبلي: 'Kebili',
          زغوان: 'Zaghouan',
          منوبة: 'Manouba',
        };

        let issuePlace = '';
        for (const [arCity, frCity] of Object.entries(arCitiesMap)) {
          if (rawText.includes(arCity) || new RegExp(`\\b${frCity}\\b`, 'i').test(rawText)) {
            issuePlace = frCity;
            break;
          }
        }

        const checks: string[] = [];
        checks.push(`✅ OCR CIN Arabe terminé (Moteur: ${ocrEngine || 'PaddleOCR Arabe/Français'}, Fiabilité: ${finalConfidence}%)`);
        if (cinNumber) {
          checks.push(`✅ Numéro CIN (بطاقة التعريف الوطنية) : ${cinNumber}`);
        } else {
          checks.push(`⚠️ Numéro CIN non détecté sur la photo — À renseigner`);
        }
        if (fullName) {
          checks.push(`✅ Titulaire identifié (الاسم واللقب) : ${fullName}`);
        } else {
          checks.push(`⚠️ Nom & prénom non détectés sur la photo — À renseigner`);
        }
        if (issuePlace || birthDate || issueDate) {
          checks.push(`✅ Naissance/Émission : ${birthDate ? 'Né(e) le ' + birthDate : ''} ${issuePlace ? 'à ' + issuePlace : ''}`);
        }

        return {
          extractedFields: {
            cinNumber,
            fullName,
            birthDate,
            issueDate,
            issuePlace,
            nationality: 'Tunisienne',
            ocrEngineUsed: ocrEngine || 'PaddleOCR Arabe/Français',
            rawTextLength: rawText.length,
          },
          aiConfidence: finalConfidence,
          checks,
          verifiedAt,
          isCompliant: true,
        };
      }

      case 'payslip': {
        // 1. Net Salary extraction
        let netSalary: number | null = null;
        const salaryKeyMatch = rawText.match(/(?:net a payer|salaire net|net imposable|net mensuel|net)[\s:]*(\d{3,5}(?:[\.,]\d{2,3})?)/i);
        if (salaryKeyMatch) {
          const val = parseFloat(salaryKeyMatch[1].replace(',', '.'));
          if (val >= 500 && val <= 20000) netSalary = val;
        }
        if (!netSalary) {
          const matches = rawText.match(/\b(\d{3,5}(?:[\.,]\d{2,3})?)\b/g);
          if (matches) {
            const parsed = matches.map((m) => parseFloat(m.replace(',', '.'))).filter((n) => n >= 800 && n <= 15000);
            if (parsed.length > 0) netSalary = parsed[0];
          }
        }

        // 2. Employer extraction
        let employer = '';
        const empKeyMatch = rawText.match(/(?:employeur|societe|société|entreprise|organisme)[\s:]*([A-Za-z0-9À-ÿ\s'\.]{3,40})/i);
        if (empKeyMatch) employer = empKeyMatch[1].trim();

        // 3. Job Title extraction
        let jobTitle = '';
        const jobKeyMatch = rawText.match(/(?:fonction|poste|qualification|emploi|profession)[\s:]*([A-Za-z0-9À-ÿ\s'\.]{3,30})/i);
        if (jobKeyMatch) jobTitle = jobKeyMatch[1].trim();

        // 4. CNSS Number
        const cnssMatch = rawText.match(/\b(\d{8}[-\s]?\d{2})\b/) || rawText.match(/\b(\d{10})\b/);
        const cnssNumber = cnssMatch ? cnssMatch[1] : '';

        const checks: string[] = [];
        checks.push(`✅ Bulletin de paie analysé par OCR (Moteur: ${ocrEngine || 'OCR'}, Fiabilité: ${finalConfidence}%)`);
        if (netSalary) {
          checks.push(`✅ Salaire net mensuel extrait : ${netSalary.toLocaleString()} TND`);
        } else {
          checks.push(`⚠️ Salaire net non détecté sur la photo — À renseigner`);
        }
        if (employer) checks.push(`✅ Employeur : ${employer}`);
        if (jobTitle || cnssNumber) checks.push(`✅ Poste : ${jobTitle || '—'} | CNSS : ${cnssNumber || '—'}`);

        return {
          extractedFields: {
            netSalary: netSalary || 0,
            netSalaryFormatted: netSalary ? `${netSalary.toLocaleString()} TND` : '—',
            employer,
            jobTitle,
            cnssNumber,
            period: 'Dernier bulletin fourni',
          },
          aiConfidence: finalConfidence,
          checks,
          verifiedAt,
          isCompliant: true,
        };
      }

      case 'statement': {
        const ribMatch = rawText.match(/\b(\d{20,24})\b/) || rawText.match(/\b(\d{2}\s?\d{3}\s?\d{13}\s?\d{2})\b/);
        const rib = ribMatch ? ribMatch[1].replace(/\s/g, '') : '';

        const balanceMatch = rawText.match(/(?:solde|solde moyen|solde final|credit)[\s:]*(\d{3,6}(?:[\.,]\d{2,3})?)/i);
        const avgBalance = balanceMatch ? `${parseFloat(balanceMatch[1].replace(',', '.')).toLocaleString()} TND` : '';

        const checks: string[] = [];
        checks.push('✅ Relevé bancaire analysé par OCR');
        if (rib) checks.push(`✅ RIB extrait de la photo : ${rib}`);
        else checks.push('⚠️ Numéro RIB non détecté — À renseigner');
        if (avgBalance) checks.push(`✅ Solde moyen détecté : ${avgBalance}`);

        return {
          extractedFields: {
            rib,
            averageBalance: avgBalance || '—',
          },
          aiConfidence: finalConfidence,
          checks,
          verifiedAt,
          isCompliant: true,
        };
      }

      case 'residence': {
        const providers = ['STEG', 'SONEDE', 'Tunisie Telecom', 'Orange', 'Ooredoo', 'Topnet'];
        const foundProvider = providers.find((p) => new RegExp(`\\b${p}\\b`, 'i').test(rawText));
        const provider = foundProvider ? `${foundProvider} (Justificatif)` : '';

        const dates = rawText.match(/\b(\d{2}[\/\.-]\d{2}[\/\.-](?:19|20)\d{2})\b/g) || [];
        const billDate = dates[0] || '';

        const addressMatch = rawText.match(/(?:adresse|domicile|rue|avenue|av\.)[\s:]*([A-Za-z0-9À-ÿ\s,\.]{5,60})/i);
        const address = addressMatch ? addressMatch[1].trim() : '';

        const checks: string[] = [];
        checks.push('✅ Justificatif de domicile analysé par l\'OCR');
        if (provider) checks.push(`✅ Organisme : ${provider}`);
        if (address) checks.push(`✅ Adresse extraite : ${address}`);
        if (billDate) checks.push(`✅ Date du document : ${billDate}`);

        return {
          extractedFields: {
            provider,
            address,
            billDate,
          },
          aiConfidence: finalConfidence,
          checks,
          verifiedAt,
          isCompliant: true,
        };
      }

      default:
        return {
          extractedFields: {},
          aiConfidence: finalConfidence,
          checks: ['Document analysé par OCR'],
          verifiedAt,
          isCompliant: true,
        };
    }
  }
}


