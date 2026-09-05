import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { useTranslation } from '../../../utils/i18n';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'urgent';
  title: string;
  body: string;
  time: string;
  read: boolean;
}

const INITIAL: Notification[] = [
  { id: '1', type: 'urgent', title: 'Document manquant', body: 'Votre fiche de paie est requise pour finaliser l\'analyse.', time: 'Il y a 1h', read: false },
  { id: '2', type: 'info', title: 'Dossier reçu', body: '#CR2026-0042 est en cours d\'instruction par nos équipes.', time: 'Hier à 14:32', read: false },
  { id: '3', type: 'success', title: 'Simulation validée', body: 'Votre simulation de crédit personnel est prête.', time: 'Il y a 2 j', read: true },
  { id: '4', type: 'info', title: 'Mise à jour système', body: 'La plateforme STB SmartCredit a été mise à jour.', time: 'Il y a 3 j', read: true },
];

const FILTERS = [
  { key: 'all', label: 'Tout' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'info', label: 'Info' },
  { key: 'success', label: 'Succès' },
] as const;

type FilterKey = 'all' | 'info' | 'success' | 'urgent';

const TYPE_CONFIG = {
  info:    { icon: 'information-circle-outline' as const, color: COLORS.primary,  bg: COLORS.primaryLight },
  success: { icon: 'checkmark-circle-outline' as const,   color: COLORS.success,  bg: COLORS.successLight },
  urgent:  { icon: 'alert-circle-outline' as const,       color: COLORS.error,    bg: COLORS.errorLight   },
};

export const NotificationsScreen = () => {
  const { isRTL } = useTranslation();
  const [notifs, setNotifs] = useState<Notification[]>(INITIAL);
  const [filter, setFilter] = useState<FilterKey>('all');

  const unread = notifs.filter(n => !n.read).length;
  const visible = filter === 'all' ? notifs : notifs.filter(n => n.type === filter);

  const markRead  = (id: string) => setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const remove    = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id));
  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>Notifications</Text>
          {unread > 0 && (
            <View style={s.unreadBadge}><Text style={s.unreadNum}>{unread}</Text></View>
          )}
        </View>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={s.markAll}>Tout lire</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={s.filters}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterBtn, filter === f.key && s.filterBtnActive]}
            onPress={() => setFilter(f.key as FilterKey)}
          >
            <Text style={[s.filterText, filter === f.key && s.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={visible}
        keyExtractor={n => n.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={32} color={COLORS.textHint} />
            <Text style={s.emptyText}>Aucune notification</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <TouchableOpacity
              style={[s.notifRow, !item.read && s.notifUnread, isRTL && { flexDirection: 'row-reverse' }]}
              onPress={() => markRead(item.id)}
            >
              <View style={[s.notifIcon, { backgroundColor: cfg.bg }]}>
                <Ionicons name={cfg.icon} size={18} color={cfg.color} />
              </View>
              <View style={s.notifBody}>
                <View style={[s.notifTitleRow, isRTL && { flexDirection: 'row-reverse' }]}>
                  <Text style={[s.notifTitle, isRTL && { textAlign: 'right' }]}>{item.title}</Text>
                  {!item.read && <View style={s.unreadDot} />}
                </View>
                <Text style={[s.notifText, isRTL && { textAlign: 'right' }]} numberOfLines={2}>{item.body}</Text>
                <Text style={s.notifTime}>{item.time}</Text>
              </View>
              <TouchableOpacity style={s.trashBtn} onPress={() => remove(item.id)}>
                <Ionicons name="trash-outline" size={16} color={COLORS.textHint} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14, borderBottomWidth: 1, borderColor: COLORS.border },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  unreadBadge: { backgroundColor: COLORS.error, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginLeft: 8, paddingHorizontal: 5 },
  unreadNum: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  markAll: { fontSize: 13, fontWeight: '600', color: COLORS.primary },

  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  filterTextActive: { color: '#FFF' },

  list: { paddingHorizontal: 16, paddingBottom: 30 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, color: COLORS.textHint, marginTop: 10, fontWeight: '500' },

  notifRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 14, borderBottomWidth: 1, borderColor: COLORS.borderLight },
  notifUnread: { backgroundColor: COLORS.background },
  notifIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  notifBody: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  notifTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, flex: 1 },
  notifText: { fontSize: 13, color: COLORS.textLight, lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: COLORS.textHint, fontWeight: '500' },
  unreadDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: COLORS.primary, marginLeft: 6 },
  trashBtn: { paddingLeft: 10, paddingTop: 2 },
});
