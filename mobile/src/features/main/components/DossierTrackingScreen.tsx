import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface DossierTrackingScreenProps {
  onUploadMissingDocument: () => void;
  showWarning?: boolean;
}

export const DossierTrackingScreen: React.FC<DossierTrackingScreenProps> = ({ onUploadMissingDocument, showWarning = true }) => {
  const { t, isRTL } = useTranslation();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const timelineSteps = [
    {
      id: 0,
      titleKey: 'track_s1_title',
      descKey: 'track_s1_desc',
      date: '10 Jan 2026',
      status: 'completed', // completed, active, pending
    },
    {
      id: 1,
      titleKey: 'track_s2_title',
      descKey: 'track_s2_desc',
      date: '11 Jan 2026',
      status: 'completed',
    },
    {
      id: 2,
      titleKey: 'track_s3_title',
      descKey: 'track_s3_desc',
      date: 'En cours',
      status: 'active',
    },
    {
      id: 3,
      titleKey: 'track_s4_title',
      descKey: 'track_s4_desc',
      date: '-',
      status: 'pending',
    },
    {
      id: 4,
      titleKey: 'track_s5_title',
      descKey: 'track_s5_desc',
      date: '-',
      status: 'pending',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('track_title')}
        </Text>

        {/* Warning card for missing documents */}
        {showWarning && (
          <View style={[styles.warningCard, isRTL && { flexDirection: 'row-reverse' }]}>
            <View style={isRTL ? { marginLeft: 12 } : { marginRight: 12 }}>
              <Ionicons name="warning-outline" size={26} color={COLORS.warning} />
            </View>
            <View style={styles.warningContent}>
              <Text style={[styles.warningTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('track_warning')}
              </Text>
              <Text style={[styles.warningDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                {t('track_warning_desc')}
              </Text>
              <TouchableOpacity style={styles.warningButton} onPress={onUploadMissingDocument}>
                <Text style={styles.warningButtonText}>{t('track_upload_now')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View style={styles.timelineContainer}>
          {timelineSteps.map((step, index) => {
            const isCompleted = step.status === 'completed';
            const isActive = step.status === 'active';
            const isLast = index === timelineSteps.length - 1;

            return (
              <View key={step.id} style={[styles.timelineItem, isRTL && { flexDirection: 'row-reverse' }]}>
                {/* Left Line & Dot indicator */}
                <View style={styles.leftColumn}>
                  {isActive ? (
                    <Animated.View style={[styles.activeDotOutline, { opacity: pulseAnim }]}>
                      <View style={styles.activeDotInner} />
                    </Animated.View>
                  ) : (
                    <View style={[styles.dot, isCompleted && styles.dotCompleted]}>
                      {isCompleted ? (
                        <Text style={styles.completedCheck}>✓</Text>
                      ) : (
                        <View style={styles.pendingDotInner} />
                      )}
                    </View>
                  )}
                  
                  {!isLast && (
                    <View style={[styles.line, isCompleted && styles.lineCompleted]} />
                  )}
                </View>

                {/* Right content box */}
                <View style={styles.rightColumn}>
                  <View style={[styles.itemHeader, isRTL && { flexDirection: 'row-reverse' }]}>
                    <Text style={styles.itemTitle}>{t(step.titleKey as any)}</Text>
                    <Text style={[styles.itemDate, isActive && { color: COLORS.accent, fontWeight: 'bold' }]}>
                      {step.date}
                    </Text>
                  </View>
                  <Text style={[styles.itemDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {t(step.descKey as any)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    marginTop: 10,
  },
  warningCard: {
    backgroundColor: 'rgba(230, 81, 0, 0.08)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 81, 0, 0.2)',
    flexDirection: 'row',
    marginBottom: 25,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  warningButton: {
    backgroundColor: COLORS.warning,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  warningButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineContainer: {
    paddingLeft: 4,
    paddingRight: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  leftColumn: {
    alignItems: 'center',
    width: 36,
  },
  dot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ECEFF1',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  dotCompleted: {
    backgroundColor: COLORS.success,
  },
  completedCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  activeDotOutline: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(30, 136, 229, 0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  activeDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  line: {
    width: 2.5,
    backgroundColor: '#ECEFF1',
    position: 'absolute',
    top: 22,
    bottom: -16,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: COLORS.success,
  },
  rightColumn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 25,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  itemDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  itemDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
});
