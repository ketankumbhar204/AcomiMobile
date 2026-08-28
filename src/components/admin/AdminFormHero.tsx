import React from 'react';
import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '../../theme';
import { adminHero } from './adminStyles';

type AdminFormHeroProps = {
  icon: LucideIcon;
  eyebrow: string;
  heading: string;
  subheading?: string;
};

export function AdminFormHero({ icon: Icon, eyebrow, heading, subheading }: AdminFormHeroProps) {
  return (
    <View style={adminHero.wrap}>
      <View style={adminHero.iconWrap}>
        <Icon size={18} color={colors.primaryDark} strokeWidth={2.2} />
      </View>
      <Text style={adminHero.eyebrow}>{eyebrow}</Text>
      <Text style={adminHero.heading}>{heading}</Text>
      {subheading ? <Text style={adminHero.subheading}>{subheading}</Text> : null}
    </View>
  );
}
