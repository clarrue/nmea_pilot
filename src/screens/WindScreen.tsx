import React, {useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {WindRose} from '../components/WindRose';
import {WindHistoryChart} from '../components/WindHistoryChart';
import {InstrumentCard} from '../components/InstrumentCard';
import {useTheme} from '../theme/ThemeContext';
import {useBoatStore} from '../store/useBoatStore';

export function WindScreen() {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const windApparent = useBoatStore(s => s.windApparent);
  const windTrue = useBoatStore(s => s.windTrue);

  const [windMode, setWindMode] = useState<'apparent' | 'true'>('apparent');
  const [showRose, setShowRose] = useState(true);
  const [showChart, setShowChart] = useState(true);

  // Track actual rendered chart panel width for the SVG
  const [chartPanelWidth, setChartPanelWidth] = useState(width);

  const activeWind = windMode === 'apparent' ? windApparent : windTrue;
  const bothVisible = showRose && showChart;

  // Prevent hiding both panels
  const toggleRose = () => { if (showChart) { setShowRose(v => !v); } };
  const toggleChart = () => { if (showRose) { setShowChart(v => !v); } };

  // Rose size: fit inside the rose panel
  const rosePanelWidth = showRose ? (bothVisible ? width / 2 : width) : 0;
  const roseSize = Math.min(rosePanelWidth - 40, height * 0.60);

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <View style={[styles.topBar, {borderBottomColor: colors.border, backgroundColor: colors.surface}]}>

        {/* APPARENT / TRUE mode toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, windMode === 'apparent' && {backgroundColor: colors.windApparent}]}
            onPress={() => setWindMode('apparent')}>
            <Text style={[styles.modeTxt, {color: windMode === 'apparent' ? colors.background : colors.textMuted}]}>
              APPARENT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, windMode === 'true' && {backgroundColor: colors.windTrue}]}
            onPress={() => setWindMode('true')}>
            <Text style={[styles.modeTxt, {color: windMode === 'true' ? colors.background : colors.textMuted}]}>
              TRUE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Panel visibility toggles */}
        <View style={styles.panelToggle}>
          <TouchableOpacity
            style={[
              styles.panelBtn,
              {borderColor: colors.border},
              showRose && {backgroundColor: colors.surfaceElevated, borderColor: colors.accent},
            ]}
            onPress={toggleRose}>
            <Text style={[styles.panelBtnTxt, {color: showRose ? colors.accent : colors.textMuted}]}>
              ROSE
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.panelBtn,
              {borderColor: colors.border},
              showChart && {backgroundColor: colors.surfaceElevated, borderColor: colors.accent},
            ]}
            onPress={toggleChart}>
            <Text style={[styles.panelBtnTxt, {color: showChart ? colors.accent : colors.textMuted}]}>
              CHART
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Panels row ──────────────────────────────────────────────────── */}
      <View style={styles.panelsRow}>

        {/* Left: Rose panel */}
        {showRose && (
          <ScrollView
            style={[
              styles.rosePanel,
              bothVisible && {borderRightWidth: 1, borderRightColor: colors.border},
            ]}
            contentContainerStyle={styles.rosePanelContent}
            showsVerticalScrollIndicator={false}>

            <View style={styles.roseCenter}>
              <WindRose
                angle={activeWind?.value.angle}
                speed={activeWind?.value.speed}
                size={roseSize}
              />
            </View>

            {/* Instrument cards */}
            <View style={styles.cardsRow}>
              <InstrumentCard
                label="AWS"
                value={windApparent ? windApparent.value.speed.toFixed(1) : null}
                unit="kn"
                updatedAt={windApparent?.updatedAt}
              />
              <InstrumentCard
                label="AWA"
                value={
                  windApparent
                    ? `${windApparent.value.angle < 0 ? '' : '+'}${windApparent.value.angle.toFixed(0)}`
                    : null
                }
                unit="°"
                updatedAt={windApparent?.updatedAt}
              />
              <InstrumentCard
                label="TWS"
                value={windTrue ? windTrue.value.speed.toFixed(1) : null}
                unit="kn"
                updatedAt={windTrue?.updatedAt}
              />
              <InstrumentCard
                label="TWA"
                value={
                  windTrue
                    ? `${windTrue.value.angle < 0 ? '' : '+'}${windTrue.value.angle.toFixed(0)}`
                    : null
                }
                unit="°"
                updatedAt={windTrue?.updatedAt}
              />
            </View>
          </ScrollView>
        )}

        {/* Right: Chart panel */}
        {showChart && (
          <View
            style={styles.chartPanel}
            onLayout={e => setChartPanelWidth(e.nativeEvent.layout.width)}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <WindHistoryChart windMode={windMode} width={chartPanelWidth} />
            </ScrollView>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {flex: 1},

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 12,
  },

  // APPARENT / TRUE toggle
  modeToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  modeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modeTxt: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // ROSE / CHART panel toggles
  panelToggle: {
    flexDirection: 'row',
    gap: 6,
  },
  panelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  panelBtnTxt: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },

  // Panels
  panelsRow: {
    flex: 1,
    flexDirection: 'row',
  },

  // Rose panel
  rosePanel: {
    flex: 1,
  },
  rosePanelContent: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  roseCenter: {
    alignItems: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingTop: 12,
    gap: 4,
  },

  // Chart panel
  chartPanel: {
    flex: 1,
  },
});
