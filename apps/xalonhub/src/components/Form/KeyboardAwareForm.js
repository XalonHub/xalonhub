import React from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { FormProvider } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';

export default function KeyboardAwareForm({ methods, children, contentContainerStyle, style }) {
    return (
        <FormProvider {...methods}>
            <KeyboardAwareScrollView
                style={[styles.container, style]}
                contentContainerStyle={[styles.content, contentContainerStyle]}
                keyboardShouldPersistTaps="handled"
                enableOnAndroid={true}
                extraHeight={160} // Pushes scroll higher so CTA button remains visible
                extraScrollHeight={20}
            >
                {children}
            </KeyboardAwareScrollView>
        </FormProvider>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flexGrow: 1 }
});
