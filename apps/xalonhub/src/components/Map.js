import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

let MapView;
let Marker;

if (Platform.OS !== 'web') {
    try {
        const ReactNativeMaps = require('react-native-maps');
        MapView = ReactNativeMaps.default;
        Marker = ReactNativeMaps.Marker;
    } catch (e) {
        console.warn('react-native-maps not found, falling back to placeholder');
    }
}

const WebMapFallback = ({ style, children }) => (
    <View style={[style, styles.fallbackContainer]}>
        <Ionicons name="map-outline" size={48} color="#CBD5E0" />
        <Text style={styles.fallbackText}>Map view is optimized for mobile.</Text>
        <Text style={styles.fallbackSubtext}>Functionality is available in the app.</Text>
        {/* Render children (Markers) as null on web via the Marker export below */}
        {children}
    </View>
);

const styles = StyleSheet.create({
    fallbackContainer: {
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fallbackText: {
        fontSize: 16,
        color: '#475569',
        fontWeight: '600',
        marginTop: 12,
        textAlign: 'center'
    },
    fallbackSubtext: {
        fontSize: 13,
        color: '#94A3B8',
        marginTop: 4,
        textAlign: 'center'
    }
});

const SafeMarker = Platform.OS === 'web' || !Marker ? () => null : Marker;
const ExportMapView = Platform.OS === 'web' || !MapView ? WebMapFallback : MapView;

export { SafeMarker as Marker };
export default ExportMapView;
