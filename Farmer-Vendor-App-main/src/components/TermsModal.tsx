import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Button } from 'react-native-paper';
import TermsAndConditions from './TermsAndConditions';

interface TermsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const TermsModal = ({ visible, onDismiss }: TermsModalProps) => {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <View style={styles.content}>
          <TermsAndConditions />
          <Button mode="contained" onPress={onDismiss} style={styles.button}>
            Close
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    height: '80%',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  button: {
    marginTop: 16,
  },
});

export default TermsModal;
