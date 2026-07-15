import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface NotificationsScreenProps {
  onSelectNotification: (notifId: number) => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onSelectNotification }) => {
  const { t, isRTL } = useTranslation();

  const [notifications, setNotifications] = useState([
    {
      id: 0,
      title: 'Votre dossier a été approuvé !',
      message: 'Félicitations, la Société Tunisienne de Banque a accepté votre demande.',
      time: `2 ${t('notif_time_h')}`,
      type: 'success', // success, info, warning, neutral
      unread: true,
      iconName: 'checkmark-circle-outline' as const,
    },
    {
      id: 1,
      title: 'Étude d\'éligibilité finalisée — Statut : Éligible',
      message: 'Votre score de crédit indique un faible niveau de risque.',
      time: `5 ${t('notif_time_h')}`,
      type: 'info',
      unread: true,
      iconName: 'analytics-outline' as const,
    },
    {
      id: 2,
      title: 'Pièce manquante : Relevé de compte requis',
      message: 'Veuillez télécharger un relevé de compte bancaire valide pour poursuivre.',
      time: `1 ${t('notif_time_d')}`,
      type: 'warning',
      unread: false,
      iconName: 'warning-outline' as const,
    },
    {
      id: 3,
      title: 'Ouverture de votre espace STB SmartCredit',
      message: 'Votre compte a été configuré avec succès. Explorez nos offres de crédit.',
      time: `3 ${t('notif_time_d')}`,
      type: 'neutral',
      unread: false,
      iconName: 'business-outline' as const,
    },
  ]);

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, unread: false }));
    setNotifications(updated);
  };

  const handlePressItem = (id: number) => {
    const updated = notifications.map((n) => {
      if (n.id === id) {
        return { ...n, unread: false };
      }
      return n;
    });
    setNotifications(updated);
    onSelectNotification(id);
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return COLORS.success;
      case 'info':
        return COLORS.accent;
      case 'warning':
        return COLORS.warning;
      default:
        return COLORS.border;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.headerRow, isRTL && { flexDirection: 'row-reverse' }]}>
        <Text style={styles.title}>{t('notif_title')}</Text>
        <TouchableOpacity onPress={handleMarkAllRead}>
          <Text style={styles.markReadText}>{t('notif_mark_all')}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const borderColor = getBorderColor(item.type);
          return (
            <TouchableOpacity
              style={[
                styles.card,
                { borderLeftColor: isRTL ? COLORS.border : borderColor },
                { borderRightColor: isRTL ? borderColor : COLORS.border },
                { borderLeftWidth: isRTL ? 1 : 4 },
                { borderRightWidth: isRTL ? 4 : 1 },
                item.unread && styles.cardUnread,
                isRTL && { flexDirection: 'row-reverse' },
              ]}
              onPress={() => handlePressItem(item.id)}
            >
              <View style={[styles.iconBox, isRTL ? { marginLeft: 12 } : { marginRight: 12 }]}>
                <Ionicons name={item.iconName} size={20} color={borderColor} />
              </View>
              
              <View style={styles.contentBox}>
                <View style={[styles.titleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[styles.itemTitle, item.unread && styles.itemTitleUnread]}>
                    {item.title}
                  </Text>
                  <Text style={styles.timeText}>{item.time}</Text>
                </View>
                <Text style={[styles.messageText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {item.message}
                </Text>
              </View>

              {item.unread && (
                <View style={[styles.unreadDot, isRTL ? { left: 10 } : { right: 10 }]} />
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#ECEFF1',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  markReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderWidth: 1,
    borderColor: '#ECEFF1',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  cardUnread: {
    backgroundColor: 'rgba(21, 101, 192, 0.01)',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
    paddingRight: 10,
    fontWeight: '500',
  },
  itemTitleUnread: {
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  messageText: {
    fontSize: 12,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
});
