import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, SPACING } from '@/src/constants/theme';

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
  valuePrefix?: string;
  maxLegendItems?: number;
}

export default function DonutChart({
  data,
  size = 140,
  strokeWidth = 18,
  centerLabel,
  centerValue,
  valuePrefix = '',
  maxLegendItems,
}: DonutChartProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noData}>No data</Text>
      </View>
    );
  }

  // Filter out zero-value segments for rendering arcs, but keep all for legend
  const nonZeroData = data.filter((d) => d.value > 0);

  let accumulated = 0;
  const segments = nonZeroData.map((segment, i) => {
    const origIndex = data.indexOf(segment);
    const percentage = segment.value / total;
    const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
    const rotation = (accumulated / total) * 360 - 90;
    accumulated += segment.value;
    return { ...segment, strokeDasharray, rotation, origIndex };
  });

  const selectedData = selected !== null ? data[selected] : null;
  const displayCenter = selectedData
    ? { value: `${valuePrefix}${selectedData.value}`, label: selectedData.label }
    : { value: centerValue, label: centerLabel };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => setSelected(null)}
        style={{ position: 'relative', width: size, height: size, alignSelf: 'center' }}
      >
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Data segments */}
          {segments.map((seg, i) => {
            const isSelected = selected === seg.origIndex;
            return (
              <Circle
                key={i}
                cx={center}
                cy={center}
                r={radius}
                stroke={seg.color}
                strokeWidth={isSelected ? strokeWidth + 6 : strokeWidth}
                fill="none"
                strokeDasharray={seg.strokeDasharray}
                strokeLinecap="round"
                rotation={seg.rotation}
                origin={`${center}, ${center}`}
                opacity={selected !== null && !isSelected ? 0.4 : 1}
                onPress={() => setSelected(isSelected ? null : seg.origIndex)}
              />
            );
          })}
        </Svg>
        {/* Center text */}
        <View style={[styles.centerText, { width: size, height: size }]}>
          {displayCenter.value && (
            <Text style={[styles.centerValue, selectedData && { color: selectedData.color }]}>
              {displayCenter.value}
            </Text>
          )}
          {displayCenter.label && (
            <Text style={styles.centerLabel} numberOfLines={1}>
              {displayCenter.label}
            </Text>
          )}
        </View>
      </TouchableOpacity>
      {/* Legend */}
      {(() => {
        const scrollable = maxLegendItems != null && data.length > maxLegendItems;
        const itemHeight = 26;
        const legendContent = data.map((d, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.legendItem,
              selected === i && styles.legendItemActive,
            ]}
            onPress={() => setSelected(selected === i ? null : i)}
            activeOpacity={0.7}
          >
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text
              style={[styles.legendText, selected !== null && selected !== i && { opacity: 0.4 }]}
              numberOfLines={1}
            >
              {d.label}
            </Text>
            <Text
              style={[styles.legendValue, selected !== null && selected !== i && { opacity: 0.4 }]}
            >
              {valuePrefix}{d.value}
            </Text>
          </TouchableOpacity>
        ));
        return scrollable ? (
          <ScrollView
            style={[styles.legend, { maxHeight: itemHeight * maxLegendItems }]}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {legendContent}
          </ScrollView>
        ) : (
          <View style={styles.legend}>{legendContent}</View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  centerText: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  centerLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    maxWidth: 80,
    textAlign: 'center',
  },
  legend: {
    marginTop: SPACING.sm,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  legendItemActive: {
    backgroundColor: '#F1F5F9',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },
  noData: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
});