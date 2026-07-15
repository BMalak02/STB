import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface DocumentUploadScreenProps {
  creditType?: string;
  onFinishUploads: () => void;
}

export const DocumentUploadScreen: React.FC<DocumentUploadScreenProps> = ({ creditType = 'Personnel', onFinishUploads }) => {
  const { t, isRTL } = useTranslation();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // Document states
  const [documents, setDocuments] = useState([
    {
      id: 0,
      nameKey: 'up_cin',
      iconName: 'card-outline' as const,
      status: 'done', // done, pending, required, empty
    },
    {
      id: 1,
      nameKey: 'up_payslip',
      iconName: 'document-text-outline' as const,
      status: 'pending',
    },
    {
      id: 2,
      nameKey: 'up_statement',
      iconName: 'stats-chart-outline' as const,
      status: 'required',
    },
    {
      id: 3,
      nameKey: 'up_residence',
      iconName: 'home-outline' as const,
      status: 'empty',
    },
  ]);

  const uploadedCount = documents.filter((doc) => doc.status === 'done').length;

  const handleCardPress = (id: number) => {
    setSelectedDocId(id);
    setModalVisible(true);
  };

  const handleUploadSource = (source: string) => {
    if (selectedDocId !== null) {
      const updatedDocs = documents.map((doc) => {
        if (doc.id === selectedDocId) {
          return { ...doc, status: 'done' };
        }
        return doc;
      });
      setDocuments(updatedDocs);
      setModalVisible(false);
      setSelectedDocId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'done':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(46, 125, 50, 0.1)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.success }]}>
              {t('up_status_done')}
            </Text>
          </View>
        );
      case 'pending':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(230, 81, 0, 0.1)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.warning }]}>
              {t('up_status_pending')}
            </Text>
          </View>
        );
      case 'required':
        return (
          <View style={[styles.badge, { backgroundColor: 'rgba(198, 40, 40, 0.1)' }]}>
            <Text style={[styles.badgeText, { color: COLORS.error }]}>
              {t('up_status_required')}
            </Text>
          </View>
        );
      default:
        return (
          <View style={[styles.badge, { backgroundColor: '#ECEFF1' }]}>
            <Text style={[styles.badgeText, { color: COLORS.textMuted }]}>
              {t('up_status_empty')}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Stepper indicator */}
        <View style={styles.stepperContainer}>
          <View style={[styles.stepDot, styles.stepDotCompleted]}><Text style={styles.stepLabelCompleted}>✓</Text></View>
          <View style={[styles.stepLine, styles.stepLineCompleted]} />
          <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepLabelActive}>2</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}><Text style={styles.stepLabel}>3</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}><Text style={styles.stepLabel}>4</Text></View>
        </View>

        <Text style={[styles.stepSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'الخطوة 2 من 4' : 'Étape 2 sur 4'}
        </Text>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('up_title')}
        </Text>
        <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL 
            ? `تحميل مستندات الإثبات لقرضك: ${creditType}`
            : `Téléchargement des justificatifs pour votre Crédit ${creditType}`
          }
        </Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTextRow}>
            <Text style={styles.progressLabel}>
              {uploadedCount} sur 4 {isRTL ? 'مستندات تم تحميلها' : 'documents téléversés'}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round((uploadedCount / 4) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarActive, { width: `${(uploadedCount / 4) * 100}%` }]} />
          </View>
        </View>

        {/* Document Cards */}
        <View style={styles.docList}>
          {documents.map((doc) => {
            return (
              <TouchableOpacity
                key={doc.id}
                style={[styles.docCard, isRTL && { flexDirection: 'row-reverse' }]}
                onPress={() => handleCardPress(doc.id)}
              >
                <View style={[styles.docIconContainer, isRTL ? { marginLeft: 16 } : { marginRight: 16 }]}>
                  <Ionicons name={doc.iconName} size={22} color={COLORS.primary} />
                </View>
                
                <View style={styles.docInfo}>
                  <Text style={[styles.docName, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t(doc.nameKey as any)}
                  </Text>
                  <View style={[styles.badgeAlign, isRTL ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]}>
                    {getStatusBadge(doc.status)}
                  </View>
                </View>

                <Ionicons 
                  name={isRTL ? "chevron-back-outline" : "chevron-forward-outline"} 
                  size={18} 
                  color={COLORS.textMuted} 
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            uploadedCount < 4 && styles.actionButtonDisabled,
          ]}
          onPress={onFinishUploads}
          disabled={uploadedCount < 4}
        >
          <Text style={styles.actionButtonText}>
            {uploadedCount < 4 
              ? (isRTL ? 'يرجى استكمال الوثائق' : 'Compléter le dossier')
              : (isRTL ? 'تقديم للمراجعة والتقييم' : 'Soumettre le dossier')
            }
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.indicatorBar} />
            <Text style={styles.modalTitle}>{t('up_modal_title')}</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, isRTL && { flexDirection: 'row-reverse' }]} 
              onPress={() => handleUploadSource('camera')}
            >
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
              <Text style={styles.optionText}>{t('up_modal_camera').replace('📷 ', '')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, isRTL && { flexDirection: 'row-reverse' }]} 
              onPress={() => handleUploadSource('gallery')}
            >
              <Ionicons name="image-outline" size={20} color={COLORS.primary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
              <Text style={styles.optionText}>{t('up_modal_gallery').replace('🖼️ ', '')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, isRTL && { flexDirection: 'row-reverse' }]} 
              onPress={() => handleUploadSource('pdf')}
            >
              <Ionicons name="document-outline" size={20} color={COLORS.primary} style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }} />
              <Text style={styles.optionText}>{t('up_modal_pdf').replace('📄 ', '')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>{isRTL ? 'إلغاء' : 'Annuler'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ECEFF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.success,
  },
  stepLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabelCompleted: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#ECEFF1',
    marginHorizontal: 8,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.success,
  },
  stepSubtitle: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 24,
  },
  progressContainer: {
    backgroundColor: '#F5F7FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 28,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#ECEFF1',
    borderRadius: 3,
  },
  progressBarActive: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  docList: {
    marginBottom: 35,
  },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#ECEFF1',
    marginBottom: 14,
  },
  docIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  docName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  badgeAlign: {
    alignSelf: 'flex-start',
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: COLORS.success,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonDisabled: {
    backgroundColor: '#ECEFF1',
    shadowOpacity: 0,
    elevation: 0,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 27, 62, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  indicatorBar: {
    width: 40,
    height: 4,
    backgroundColor: '#CFD8DC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F5F7FA',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.text,
  },
  cancelButton: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
