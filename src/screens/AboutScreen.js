import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomStatusBar from '../components/CustomStatusBar';

const {width, height} = Dimensions.get('window');

const AboutScreen = ({navigation}) => {
  return (
    <>
      <CustomStatusBar statusBgColor="#00796b">
        <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.header}>
          <TouchableOpacity
            // style={{top: 20}}
            onPress={() => navigation.navigate('Dashboard')}>
            <Icon name="arrow-back" size={width * 0.06} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>About</Text>
        </LinearGradient>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
            <Text style={styles.appName}>Family Income & Expense Manager</Text>
            <Text style={styles.description}>
              Welcome to Income & Expense Manager! Your ultimate tool for
              effortless, transparent, and collaborative financial management.
              Whether you're tracking personal expenses or managing family
              finances, we make it simple and stress-free. Let's take control of
              your finances together!
            </Text>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features at a Glance:</Text>
              <Text style={styles.feature}>
                <Text style={styles.bold}>🌟 Personal Financial Tracking:</Text>{' '}
                Add and categorize your income and expenses with a few simple
                taps.
              </Text>
              <Text style={styles.feature}>
                <Text style={styles.bold}>📊 Monthly and Yearly Reports:</Text>{' '}
                Gain insights into your financial health with detailed monthly
                and yearly reports.
              </Text>
              <Text style={styles.feature}>
                <Text style={styles.bold}>👨‍👩‍👧‍👦 Family Collaboration:</Text> Add
                family members by their user ID to manage and review shared
                finances.
              </Text>
              <Text style={styles.feature}>
                <Text style={styles.bold}>🖼️ Bill & Receipt Management:</Text>{' '}
                Upload images of your bills or receipts to keep your records
                organized.
              </Text>
              <Text style={styles.feature}>
                <Text style={styles.bold}>📈 Comprehensive Summaries:</Text>{' '}
                View individual and family-level summaries, including total
                income, expenses, and trends.
              </Text>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Why Choose Us?</Text>
              <Text style={styles.note}>
                <Text style={styles.bold}>💡 Ease of Use:</Text> Designed with a
                clean and intuitive interface for all users.
              </Text>
              <Text style={styles.note}>
                <Text style={styles.bold}>🔒 Secure Data:</Text> Your financial
                data is safe, private, and accessible only to you.
              </Text>
              <Text style={styles.note}>
                <Text style={styles.bold}>🎯 Goal-Oriented:</Text> Stay on top
                of your finances and achieve your saving goals effortlessly.
              </Text>
            </View>

            <Text style={styles.footer}>
              Thank you for choosing Income & Expense Manager. Let's simplify
              your financial life, one transaction at a time.
            </Text>
          </View>
        </ScrollView>
      </CustomStatusBar>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    height: height * 0.1,
    paddingHorizontal: width * 0.05,
    borderBottomLeftRadius: Platform.OS === 'ios' ? 40 : 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00796b',
    padding: 15,
  },
  description: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'justify',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  feature: {
    fontSize: 16,
    color: '#444',
    marginVertical: 5,
    lineHeight: 22,
  },
  note: {
    fontSize: 16,
    color: '#555',
    marginVertical: 5,
    lineHeight: 22,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
  footer: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 22,
  },
});

export default AboutScreen;
