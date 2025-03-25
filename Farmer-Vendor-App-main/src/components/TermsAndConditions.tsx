import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

const TermsAndConditions = () => {
  const theme = useTheme();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms and Conditions</Text>
      
      <Text style={styles.section}>1. Acceptance of Terms</Text>
      <Text style={styles.content}>
        By accessing and using this application, you agree to be bound by these terms and conditions.
      </Text>

      <Text style={styles.section}>2. User Registration</Text>
      <Text style={styles.content}>
        2.1. You must provide accurate and complete information during registration.{'\n'}
        2.2. You are responsible for maintaining the confidentiality of your account credentials.{'\n'}
        2.3. You must be at least 18 years old to use this service.
      </Text>

      <Text style={styles.section}>3. User Conduct</Text>
      <Text style={styles.content}>
        3.1. You agree not to misuse the service or help anyone else do so.{'\n'}
        3.2. You are responsible for all activities under your account.{'\n'}
        3.3. You must not engage in fraudulent or deceptive practices.
      </Text>

      <Text style={styles.section}>4. Product Listings (For Vendors)</Text>
      <Text style={styles.content}>
        4.1. All product information must be accurate and up-to-date.{'\n'}
        4.2. Prices must be clearly displayed and include all applicable taxes.{'\n'}
        4.3. Products must comply with all applicable laws and regulations.
      </Text>

      <Text style={styles.section}>5. Transactions</Text>
      <Text style={styles.content}>
        5.1. All transactions must be conducted through the platform.{'\n'}
        5.2. Payment terms must be clearly stated and agreed upon.{'\n'}
        5.3. Delivery terms must be specified and adhered to.
      </Text>

      <Text style={styles.section}>6. Privacy</Text>
      <Text style={styles.content}>
        6.1. We collect and process your data as described in our Privacy Policy.{'\n'}
        6.2. You agree to our data collection and processing practices.
      </Text>

      <Text style={styles.section}>7. Termination</Text>
      <Text style={styles.content}>
        7.1. We reserve the right to terminate or suspend accounts for violations.{'\n'}
        7.2. You may terminate your account at any time by contacting support.
      </Text>

      <Text style={styles.section}>8. Changes to Terms</Text>
      <Text style={styles.content}>
        8.1. We may modify these terms at any time.{'\n'}
        8.2. Continued use after changes constitutes acceptance of new terms.
      </Text>

      <Text style={styles.section}>9. Contact</Text>
      <Text style={styles.content}>
        For questions about these terms, please contact our support team.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
});

export default TermsAndConditions;
