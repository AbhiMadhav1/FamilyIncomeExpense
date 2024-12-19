import React from 'react';
import {
  Modal,
  TouchableOpacity,
  Text,
  View,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {PieChart} from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';

const {width, height} = Dimensions.get('window');

const ChartModal = ({
  chartmodalVisible,
  setChartModalVisible,
  pieChartData,
  formattedMonthYear,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={chartmodalVisible}
      onRequestClose={() => setChartModalVisible(false)}>
      <View style={styles.modalOverlay}>
        {/* <LinearGradient colors={['#00796b', '#20b2aa']} style={styles.modalContainer}> */}
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setChartModalVisible(false)}
            style={styles.chartModalCloseButton}>
            <Icon name="close" size={25} color="#dc3545" />
          </TouchableOpacity>

          {/* Title with updated color */}
          <Text style={styles.chartTitle}>
            Income & Expense Chart for {formattedMonthYear}
          </Text>

          {/* PieChart inside the Modal */}
          <PieChart
            data={pieChartData}
            width={width - 40}
            height={height * 0.3}
            chartConfig={{
              backgroundColor: '#1e2923',
              backgroundGradientFrom: '#00796b',
              backgroundGradientTo: '#20b2aa',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 10]}
            hasLegend={true}
          />
          {/* </LinearGradient> */}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: width - 40,
    backgroundColor: '#cde8e5',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    minHeight: height * 0.4,
  },
  chartTitle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    padding: 9,
    textAlign: 'center',
  },
  chartModalCloseButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 10,
    right: 10,
    padding: 5,
  },
});

export default ChartModal;
