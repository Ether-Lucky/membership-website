// src/components/member/DigitalIDCard.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import type { DigitalIDCard as IDCardData } from '../../types/member.types';

interface Props {
  data: IDCardData;
}

const CARD_WIDTH = Dimensions.get('window').width - 48;
const CARD_HEIGHT = CARD_WIDTH * 0.63; // Standard ID card ratio

const COLORS = {
  navy: '#0F1F3D',
  gold: '#C9A84C',
  white: '#FFFFFF',
  lightGray: '#F0F4FF',
  textDim: 'rgba(255,255,255,0.65)',
};

export function DigitalIDCard({ data }: Props) {
  return (
    <View style={styles.card}>
      {/* Header band */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoInitial}>M</Text>
          </View>
          <View>
            <Text style={styles.orgName}>{data.organizationName}</Text>
            <Text style={styles.cardLabel}>MEMBERSHIP CARD</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{data.status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Main content */}
      <View style={styles.body}>
        {/* Left: Photo */}
        <View style={styles.photoContainer}>
          {data.photoUrl ? (
            <Image
              source={{ uri: data.photoUrl }}
              style={styles.photo}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={styles.photoInitial}>
                {data.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.photoFrame} />
        </View>

        {/* Center: Details */}
        <View style={styles.details}>
          <Text style={styles.nameLabel}>FULL NAME</Text>
          <Text style={styles.name} numberOfLines={2}>{data.fullName}</Text>

          <View style={styles.divider} />

          <Text style={styles.fieldLabel}>MEMBERSHIP ID</Text>
          <Text style={styles.membershipId}>{data.membershipNumber}</Text>

          <Text style={styles.fieldLabel}>MEMBER SINCE</Text>
          <Text style={styles.fieldValue}>{data.memberSince}</Text>
        </View>

        {/* Right: QR */}
        <View style={styles.qrContainer}>
          <QRCode
            value={data.qrCodeData}
            size={84}
            color={COLORS.navy}
            backgroundColor={COLORS.white}
          />
          <Text style={styles.qrLabel}>SCAN TO{'\n'}VERIFY</Text>
        </View>
      </View>

      {/* Footer accent line */}
      <View style={styles.footer}>
        <View style={styles.goldLine} />
        <Text style={styles.footerText}>
          This card is the property of {data.organizationName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.navy,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.gold,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 18,
  },
  orgName: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  cardLabel: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
  },
  statusBadge: {
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    color: COLORS.gold,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  body: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 72,
    height: 90,
    borderRadius: 6,
  },
  photoPlaceholder: {
    backgroundColor: COLORS.gold + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoInitial: {
    color: COLORS.gold,
    fontSize: 28,
    fontWeight: '700',
  },
  photoFrame: {
    position: 'absolute',
    inset: 0,
    borderWidth: 2,
    borderColor: COLORS.gold + '80',
    borderRadius: 6,
  },
  details: {
    flex: 1,
  },
  nameLabel: {
    color: COLORS.textDim,
    fontSize: 8,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  name: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gold + '40',
    marginVertical: 8,
  },
  fieldLabel: {
    color: COLORS.textDim,
    fontSize: 7.5,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 1,
    marginTop: 6,
  },
  membershipId: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  fieldValue: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  qrLabel: {
    color: COLORS.textDim,
    fontSize: 7,
    fontWeight: '600',
    letterSpacing: 1,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  goldLine: {
    height: 2,
    backgroundColor: COLORS.gold,
    marginBottom: 6,
    borderRadius: 1,
  },
  footerText: {
    color: COLORS.textDim,
    fontSize: 7.5,
    textAlign: 'center',
  },
});
