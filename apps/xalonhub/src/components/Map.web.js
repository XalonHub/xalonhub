import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Web fallback for maps since react-native-maps throws native module errors on Web
export const MapView = ({ children, style }) => (
    <View style={[styles.container, style]}>
        <Text style={styles.text}>Map View (Web Placeholder)</Text>
        {children}
    </View>
);

export const Marker = ({ title }) => (
    <View style={styles.marker}>
        <Text style={styles.markerText}>📍 {title || 'Marker'}</Text>
    </View>
);

export default MapView;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    text: {
        color: '#64748B',
        fontWeight: 'bold',
        marginBottom: 10,
    },
    marker: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerText: {
        fontSize: 24,
    }
});
