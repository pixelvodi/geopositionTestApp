import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  PermissionsAndroid,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';

const SERVER_IP = '10.0.2.2'; 
const SERVER_PORT = 3000; 

const requestLocationPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Geolocation',
        message: 'Can we access your location?',
        buttonNeutral: 'Ask me later',
        buttonNegative: 'Cancel',
        buttonPositive: 'Ok',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.log('Permission error:', err);
    return false;
  }
};

const App = () => {
  const [location, setLocation] = useState(null);
  const [work, setWork] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      console.log('Location permission denied');
      return;
    }
    Geolocation.getCurrentPosition(
      position => {
        setLocation(position);
        getwork({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      error => {
        console.log('Geolocation error:', error);
        setLocation(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const getwork = async (coords) => {
    try {
      const response = await fetch(`http://${SERVER_IP}:${SERVER_PORT}/getworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coords),
      });
      const data = await response.json();
      if (Array.isArray(data)) {
        setWork(data);
      } else {
        console.warn('Data is not an array:', data);
        setWork([]);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {work.length > 0 ? (
          work.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => {
                setSelectedWork(item);
                setModalVisible(true);
              }}
            >
              <Text style={styles.title}>{item.company_name}</Text>
              <Text style={styles.text}>{item.address}</Text>
              <Text style={styles.text}>{item.customer_rating}</Text>
              <Text style={styles.text}>Отзывы: {item.customer_feedbacks_count}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.text}>Загрузка данных...</Text>
        )}
      </ScrollView>

      {selectedWork && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Подробная информация</Text>
              <View style={styles.modalTitle}>
                {selectedWork.logo ? (
                  <Image
                    source={{ uri: `http://${SERVER_IP}:${SERVER_PORT}/images/${selectedWork.logo}` }}
                    style={{ width: 60, height: 60 }}
                    resizeMode="contain"
                  />
                ) : null}
                <Text style={styles.modalTextTitle}>{selectedWork.company_name}</Text>
              </View>
              <View>
                <Text style={styles.modalText}>{selectedWork.work_type_name}</Text>
              </View>
              <View style={styles.workers}>
                <Text style={styles.modalTextWorkers}>Сколько людей посмотрели: {selectedWork.current_workers}</Text>
                <Text style={styles.modalTextWorkers}>Сколько людей нужны: {selectedWork.plan_workers}</Text>
              </View>
              <View style={styles.moreInfo}>
                <Text style={styles.modalText}>Адрес: {selectedWork.address}</Text>
                <Text style={styles.modalText}>Дата начала: {selectedWork.date_start}</Text>
                <Text style={styles.modalText}>Рабочее время: {selectedWork.time_start} - {selectedWork.time_end}</Text>
                <Text style={styles.modalText}>{selectedWork.price_worker} рублей за смену</Text>
                <Text style={styles.modalText}>Отзывов: {selectedWork.customer_feedbacks_count}</Text>
                <Text style={styles.modalText}>Оценка: {selectedWork.customer_rating}</Text>
              </View>
              <Pressable
                style={[styles.button, styles.buttonClose]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.textStyle}>Закрыть</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}

      <View style={styles.locationBox}>
        <Text style={styles.locationText}>
          Широта: {location ? location.coords.latitude.toFixed(5) : '...'}
        </Text>
        <Text style={styles.locationText}>
          Долгота: {location ? location.coords.longitude.toFixed(5) : '...'}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Обновить локацию" onPress={getLocation} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f2f2f2', paddingTop: 50 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 20, alignItems: 'center' },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
    elevation: 3,
  },
  title: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#333' },
  text: { fontSize: 14, color: '#555', marginBottom: 4 },
  locationBox: { padding: 16, borderTopWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  locationText: { fontSize: 14, color: '#444' },
  buttonContainer: { paddingHorizontal: 16, paddingBottom: 20, backgroundColor: '#fff' },
  centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  modalView: {
    width: '100%',
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  workers: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    flexDirection: 'row',
    borderRadius: 10,
  },
  button: { borderRadius: 20, padding: 10, elevation: 2 },
  buttonClose: { backgroundColor: '#2196F3' },
  textStyle: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
  modalText: { marginBottom: 15, textAlign: 'center' },
  modalTextTitle: { marginBottom: 15, textAlign: 'center', fontSize: 20 },
  modalTextWorkers: { marginBottom: 15, textAlign: 'center', fontSize: 10 },
  moreInfo: { width: '100%', alignItems: 'flex-start' },
});

export default App;
