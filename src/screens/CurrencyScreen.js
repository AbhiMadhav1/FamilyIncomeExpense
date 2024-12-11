import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  StatusBar,
  Platform,
  Animated,
} from 'react-native';
import CountryPicker from 'react-native-country-picker-modal';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomStatusBar from '../components/CustomStatusBar';
import LinearGradient from 'react-native-linear-gradient';
import CalculatorScreen from '../components/CalculatorScreen';

const {width, height} = Dimensions.get('window');
const scale = size => (width / 375) * size;
const verticalScale = size => (height / 667) * size;

const CurrencyConverter = ({navigation}) => {
  const [amount, setAmount] = useState('');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('USD');
  const [convertedAmount, setConvertedAmount] = useState(null);
  const [exchangeRates, setExchangeRates] = useState({});
  const [fromCountry, setFromCountry] = useState(null);
  const [toCountry, setToCountry] = useState(null);
  const [isConverted, setIsConverted] = useState(false);
  const [activeTab, setActiveTab] = useState('CurrencyConverter');

  const rotateAnim = useRef(new Animated.Value(0)).current;
  0;
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await fetch(
          `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
        );
        const data = await response.json();
        setExchangeRates(data.rates);
      } catch (error) {
        console.error('Error fetching exchange rates:', error);
      }
    };

    if (fromCurrency) {
      fetchExchangeRates();
    }
  }, [fromCurrency]);

  const convertCurrency = () => {
    if (amount && exchangeRates[toCurrency]) {
      const result = (amount * exchangeRates[toCurrency]).toFixed(2);
      setConvertedAmount(result);
      setIsConverted(true);
    } else {
      setConvertedAmount(null);
    }
  };

  const resetState = () => {
    setAmount('');
    setConvertedAmount(null);
    setIsConverted(false);
  };

  const onSelectFromCountry = selectedCountry => {
    setFromCountry(selectedCountry);
    const countryCurrency = selectedCountry.currency
      ? selectedCountry.currency[0]
      : 'USD';
    setFromCurrency(countryCurrency);
  };

  const onSelectToCountry = selectedCountry => {
    setToCountry(selectedCountry);
    const countryCurrency = selectedCountry.currency
      ? selectedCountry.currency[0]
      : 'USD';
    setToCurrency(countryCurrency);
  };

  const startRotation = () => {
    rotateAnim.setValue(0); // Reset animation value
    Animated.timing(rotateAnim, {
      toValue: 1, // Rotate from 0 to 1
      duration: 500, // Animation duration
      useNativeDriver: true,
    }).start();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const animatedStyle = {
    transform: [{rotate: rotateInterpolate}],
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
    setFromCountry(toCountry);
    setToCountry(fromCountry);
    startRotation();
  };

  const handleBackPress = () => {
    resetState();
    navigation.goBack();
  };

  return (
    <CustomStatusBar statusBgColor="#00796b">
      <View style={styles.container}>
        <StatusBar
          backgroundColor="#00796b"
          barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'}
        />
        <LinearGradient
          colors={['#00796b', '#20b2aa']}
          style={styles.headerContainer}>
          <View style={styles.headerRow}>
            {/* Back button on the left */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Dashboard')}>
              <Icon name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'CurrencyConverter' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('CurrencyConverter')}>
              <Text style={styles.tabText}>Currency Converter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'Calculator' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('Calculator')}>
              <Text style={styles.tabText}>Calculator</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Conditional Rendering */}
        {activeTab === 'CurrencyConverter' ? (
          <View style={styles.mainContainer}>
            {/* <Image
            source={require('../assets/illustration/currency.jpg')}
            style={styles.illustration}
            resizeMode="contain"
          /> */}
            <View style={styles.inputContainer}>
              <Icon
                name="cash-outline"
                size={20}
                color="#888"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                placeholderTextColor="#aaa"
              />
            </View>
            <View style={styles.pickerContainer}>
              <View style={styles.countryPicker}>
                <CountryPicker
                  withFlag
                  withCurrency
                  withFilter
                  withAlphaFilter
                  withEmoji
                  withCountryNameButton
                  onSelect={onSelectFromCountry}
                  countryCode={fromCountry ? fromCountry.cca2 : 'US'}
                  theme={{
                    backgroundColor: '#fff',
                    flagSizeButton: 30,
                  }}
                />
              </View>
              <TouchableOpacity
                onPress={swapCurrencies}
                style={styles.swapButton}>
                <Animated.Image
                  source={require('../assets/icons/money-exchange.png')}
                  style={[
                    {height: 35, width: 35, resizeMode: 'contain'},
                    animatedStyle,
                  ]}
                />
              </TouchableOpacity>
              <View style={styles.countryPicker}>
                <CountryPicker
                  withFlag
                  withCurrency
                  withFilter
                  withCountryNameButton
                  onSelect={onSelectToCountry}
                  countryCode={toCountry ? toCountry.cca2 : 'US'}
                  theme={{
                    backgroundColor: '#fff',
                    flagSizeButton: 30,
                  }}
                />
              </View>
            </View>
            <Text style={styles.resultText}>
              Result :{' '}
              {convertedAmount !== null
                ? `${amount || '0'} ${fromCurrency} = ${
                    convertedAmount || '0.00'
                  } ${toCurrency}`
                : ''}
            </Text>
            <View style={styles.convertButtonContainer}>
              <View style={styles.buttonContainer}>
                {/* Convert Button */}
                <LinearGradient
                  colors={['#00796b', '#20b2aa']}
                  style={styles.convertButton}>
                  <TouchableOpacity onPress={convertCurrency}>
                    <Text style={styles.convertButtonText}>Convert</Text>
                  </TouchableOpacity>
                </LinearGradient>

                {/* Reset Button */}
                <LinearGradient
                  colors={['#fd0004', '#f38282']}
                  style={styles.convertButton}>
                  <TouchableOpacity onPress={resetState}>
                    <Text style={styles.convertButtonText}>Reset</Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          </View>
        ) : (
          <CalculatorScreen />
        )}
      </View>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingVertical: height * 0.03,
  },
  headerContainer: {
    paddingVertical: verticalScale(15),
    paddingHorizontal: scale(15),
    backgroundColor: '#00796b',
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'center',
    borderBottomLeftRadius: Platform.OS === 'ios' ? 50 : 50,
    borderBottomRightRadius: Platform.OS === 'ios' ? 0 : 0,
    marginBottom: verticalScale(10),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  backButton: {
    alignItems: 'flex-start',
    padding: scale(10),
  },
  headerTitle: {
    fontSize: scale(20),
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // borderRadius: 20,
    // padding: 8,
    // marginVertical: 0,
    // width: '90%',
    // alignSelf: 'center',
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 4,
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: '#fff',
  },

  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },

  illustration: {
    width: '100%',
    height: height * 0.25,
    marginBottom: height * 0.01,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00796b',
    borderRadius: 12,
    paddingLeft: width * 0.02,
    marginBottom: height * 0.015,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: height * 0.06,
    padding: width * 0.03,
    color: '#000',
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.03,
  },
  countryPicker: {
    flex: 1,
    padding: 10,
    borderColor: '#00796b',
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  swapButton: {
    paddingHorizontal: 10,
  },
  convertButtonContainer: {
    marginTop: height * 0.02,
  },
  convertButton: {
    paddingVertical: height * 0.015,
    borderRadius: 10,
    marginBottom: height * 0.03,
  },
  convertButtonText: {
    fontSize: width * 0.05,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultText: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#00796b',
    marginBottom: height * 0.03,
    marginTop: height * 0.02,
    textAlign: 'left',
  },
});

export default CurrencyConverter;
