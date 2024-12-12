import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  Alert,
  Modal,
  TextInput,
  ImageBackground,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import {useUser} from './UserContext';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import Clipboard from '@react-native-clipboard/clipboard';
import firestore from '@react-native-firebase/firestore';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import CustomStatusBar from './CustomStatusBar';
import {ScrollView} from 'react-native-gesture-handler';

const {width, height} = Dimensions.get('window');

const CustomDrawerContent = props => {
  const {logout} = useUser();
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    userId: '',
    avatarUrl: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [newMemberId, setNewMemberId] = useState('');
  const [members, setMembers] = useState([]);
  const [isUserIdCopied, setIsUserIdCopied] = useState(false);
  const [showAddMemberOption, setShowAddMemberOption] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMember, setLoadingMember] = useState(null);

  const {navigation} = props;

  const fetchUserDataFromFirestore = async () => {
    try {
      const user = auth().currentUser;
      if (user) {
        const userDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          setUserData({
            name: userData.name || '',
            email: userData.email || '',
            userId: userData.userId || '',
            avatarUrl: userData.avatar || '',
          });
        } else {
          console.log('User data not found in Firestore.');
        }
      }
    } catch (error) {
      console.error('Error fetching user data from Firestore:', error);
    }
  };

  // Refresh data every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUserDataFromFirestore();
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const currentUserId = auth().currentUser.uid;
        const membersSnapshot = await firestore()
          .collection('users')
          .doc(currentUserId)
          .collection('members')
          .get();

        const membersData = membersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setMembers(membersData);
      } catch (error) {
        console.error('Error fetching members:', error);
        Alert.alert(
          'Error',
          'Could not fetch members. Please try again later.',
        );
      }
    };

    fetchMembers();
  }, []);

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message:
          'Check out this awesome app! Download it here: https://yourappdownloadlink.com',
        title: 'Share My App',
      });

      if (result.action === Share.sharedAction) {
      } else if (result.action === Share.dismissedAction) {
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            const currentUser = auth().currentUser;

            if (currentUser) {
              await auth().signOut();
              console.log('User signed out successfully.');
            } else {
              console.log('No user currently signed in.');
            }

            // Clear AsyncStorage (session data)
            await AsyncStorage.clear();

            navigation.reset({
              index: 0,
              routes: [{name: 'SignIn'}],
            });
          } catch (error) {
            console.error('Failed to logout user:', error);
            Alert.alert(
              'Error',
              'An issue occurred while logging out. Please try again.',
            );
          }
        },
      },
    ]);
  };

  const handleAddMember = async () => {
    const newMemberIdInput = newMemberId.trim(); // Get new member ID

    if (!newMemberIdInput) {
      Alert.alert('Error', 'Please enter a valid user ID');
      return;
    }

    setLoading(true); // Start loading

    try {
      // Get the current user's ID
      const currentUserId = auth().currentUser.uid;

      // Fetch user data of the new member
      const userDoc = await firestore()
        .collection('users')
        .doc(newMemberIdInput)
        .get();

      if (userDoc.exists) {
        // New member data to be added
        const newMemberData = {id: newMemberIdInput, ...userDoc.data()};

        // Save the new member data under the current user's "members" subcollection
        await firestore()
          .collection('users')
          .doc(currentUserId)
          .collection('members')
          .doc(newMemberIdInput)
          .set(newMemberData);

        // Optionally, save income/expense data from the new member
        const incomeEntriesSnapshot = await firestore()
          .collection('users')
          .doc(newMemberIdInput)
          .collection('incomeEntries')
          .get();

        const expenseEntriesSnapshot = await firestore()
          .collection('users')
          .doc(newMemberIdInput)
          .collection('expenseEntries')
          .get();

        // Store income and expense entries in the current user's "members" subcollection
        const batch = firestore().batch();
        const memberRef = firestore()
          .collection('users')
          .doc(currentUserId)
          .collection('members')
          .doc(newMemberIdInput);

        incomeEntriesSnapshot.docs.forEach(doc => {
          batch.set(
            memberRef.collection('incomeEntries').doc(doc.id),
            doc.data(),
          );
        });

        expenseEntriesSnapshot.docs.forEach(doc => {
          batch.set(
            memberRef.collection('expenseEntries').doc(doc.id),
            doc.data(),
          );
        });

        // Commit the batch to save all income/expense entries
        await batch.commit();

        // Add the new member to the local state to update the UI
        setMembers(prevMembers => [...prevMembers, newMemberData]);

        Alert.alert('Member Added', `${newMemberData.name} has been added`);
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert(
        'Error',
        'Could not fetch user data. Please try again later.',
      );
    } finally {
      setLoading(false); // Stop loading
      setNewMemberId(''); // Reset the input field
      setModalVisible(false); // Close the modal (if applicable)
    }
  };

  const handleMemberPress = async memberId => {
    try {
      setLoadingMember(memberId); // Set loading state for the clicked member

      const memberDoc = await firestore()
        .collection('users')
        .doc(memberId)
        .get();

      if (memberDoc.exists) {
        const memberData = memberDoc.data();
        console.log('Fetched Member: ', memberData);

        // Get the avatar URL
        const avatar = memberData.avatar;

        const [incomeEntriesSnapshot, expenseEntriesSnapshot] =
          await Promise.all([
            firestore()
              .collection('users')
              .doc(memberId)
              .collection('incomeEntries')
              .get(),
            firestore()
              .collection('users')
              .doc(memberId)
              .collection('expenseEntries')
              .get(),
          ]);

        console.log('IncomeEntriesSnapshot: ', incomeEntriesSnapshot.docs);
        console.log('ExpenseEntriesSnapshot: ', expenseEntriesSnapshot.docs);

        const incomeEntries = incomeEntriesSnapshot.docs.map(doc => ({
          id: doc.id,
          amount: doc.data().amount || 0,
          date: doc.data().date || 'N/A',
          description: doc.data().description || 'No description',
        }));

        const expenseEntries = expenseEntriesSnapshot.docs.map(doc => ({
          id: doc.id,
          amount: doc.data().amount || 0,
          date: doc.data().date || 'N/A',
          description: doc.data().description || 'No description',
        }));

        console.log('Mapped Income Entries: ', incomeEntries);
        console.log('Mapped Expense Entries: ', expenseEntries);

        // Navigate to MemberReportScreen and pass data
        props.navigation.navigate('MemberReport', {
          memberData,
          incomeEntries,
          expenseEntries,
          avatar,
        });
      } else {
        Alert.alert('Error', 'Member data not found');
      }
    } catch (error) {
      console.error('Error fetching member data:', error);
      Alert.alert('Error', 'Failed to fetch member data. Please try again.');
    } finally {
      setLoadingMember(null); // Reset loading state after fetch (success or failure)
    }
  };

  const copyUserIdToClipboard = async () => {
    try {
      await Clipboard.setString(userData.userId);
      setIsUserIdCopied(true);
      setTimeout(() => {
        setIsUserIdCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy user ID:', error);
    }
  };

  const toggleAddMemberOption = () => {
    setShowAddMemberOption(prev => !prev);
  };

  // const handleRemoveMember = memberId => {
  //   try {
  //     // Update local state to remove the member from the display
  //     setMembers(prevMembers => prevMembers.filter(member => member.id !== memberId));

  //     Alert.alert('Member Removed', 'The member has been removed.');
  //   } catch (error) {
  //     console.error('Error removing member from display:', error);
  //     Alert.alert('Error', 'Could not remove the member. Please try again later.');
  //   }
  // };

  // handle added memebr Remove
  const handleRemoveMember = async memberId => {
    try {
      const currentUserId = auth().currentUser.uid;
      // Remove the member document from the current user's "members" subcollection
      await firestore()
        .collection('users')
        .doc(currentUserId)
        .collection('members')
        .doc(memberId)
        .delete();

      console.log('Member removed from Firebase:', memberId);

      // Update local state
      setMembers(prevMembers =>
        prevMembers.filter(member => member.id !== memberId),
      );

      // Alert.alert('Success', 'Member removed successfully');
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert(
        'Error',
        'Could not remove the member. Please try again later.',
      );
    }
  };

  // member Total details function
  const handleTotalPress = async () => {
    try {
      setLoading(true); // Set loading state to true before fetching data

      let totalIncome = 0;
      let totalExpense = 0;

      // Get the current user ID
      const currentUserId = auth().currentUser.uid;

      // Fetch the current user's income entries
      const currentUserIncomeSnapshot = await firestore()
        .collection('users')
        .doc(currentUserId)
        .collection('incomeEntries')
        .get();

      const currentUserIncome = currentUserIncomeSnapshot.docs.reduce(
        (sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        },
        0,
      );

      // Fetch the current user's expense entries
      const currentUserExpenseSnapshot = await firestore()
        .collection('users')
        .doc(currentUserId)
        .collection('expenseEntries')
        .get();

      const currentUserExpense = currentUserExpenseSnapshot.docs.reduce(
        (sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        },
        0,
      );

      // Fetch members of the current user
      const membersSnapshot = await firestore()
        .collection('users')
        .doc(currentUserId)
        .collection('members')
        .get();

      if (
        membersSnapshot.empty &&
        currentUserIncome === 0 &&
        currentUserExpense === 0
      ) {
        Alert.alert('Error', 'No data found for current user or members.');
        return;
      }

      // Calculate total income and expenses for each member
      const memberCalculations = membersSnapshot.docs.map(async doc => {
        const member = doc.data();

        // Fetch income entries for the member
        const incomeSnapshot = await firestore()
          .collection('users')
          .doc(member.id)
          .collection('incomeEntries')
          .get();

        const memberIncome = incomeSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);

        // Fetch expense entries for the member
        const expenseSnapshot = await firestore()
          .collection('users')
          .doc(member.id)
          .collection('expenseEntries')
          .get();

        const memberExpense = expenseSnapshot.docs.reduce((sum, doc) => {
          const data = doc.data();
          return sum + (data.amount || 0);
        }, 0);

        return {member, memberIncome, memberExpense};
      });

      // Wait for all member calculations to complete
      const results = await Promise.all(memberCalculations);

      // Aggregate total income and expenses (current user + members)
      totalIncome = currentUserIncome;
      totalExpense = currentUserExpense;

      results.forEach(({memberIncome, memberExpense}) => {
        totalIncome += memberIncome;
        totalExpense += memberExpense;
      });

      // Include the current user in the data for members
      const membersWithCurrentUser = [
        {
          id: currentUserId,
          name: 'Current User',
          memberIncome: currentUserIncome,
          memberExpense: currentUserExpense,
        },
        ...results.map(({member, memberIncome, memberExpense}) => ({
          id: member.id,
          name: member.name,
          memberIncome,
          memberExpense,
        })),
      ];

      // Navigate to the TotalDetailsScreen with the totals and details
      navigation.navigate('TotalDetailsScreen', {
        members: membersWithCurrentUser,
        totalIncome,
        totalExpense,
      });
    } catch (error) {
      console.error('Error calculating totals:', error);
      Alert.alert(
        'Error',
        'Could not calculate totals. Please try again later.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomStatusBar statusBgColor="#00796b">
      <View style={styles.container}>
        <LinearGradient
          colors={['#00796b', '#20b2aa']}
          style={styles.background}>
          {/* <ImageBackground
          source={require('../assets/image/drawerimage1.jpg')}
          style={styles.background}
          resizeMode="cover"
          blurRadius={2}> */}
          {/* Circle for initials */}
          <View style={styles.avatarContainer}>
            {userData.avatarUrl ? (
              <Image
                source={{uri: `data:image/jpeg;base64,${userData.avatarUrl}`}}
                style={styles.avatarImage}
              />
            ) : (
              <LinearGradient
                colors={['#20b2aa', '#3cb371']}
                style={styles.initialsContainer}>
                {userData.name ? (
                  <Text style={styles.initialsText}>
                    {userData.name
                      .split(' ')
                      .map(name => name.charAt(0).toUpperCase())
                      .join('')}
                  </Text>
                ) : (
                  <Text style={styles.initialsText}>GN</Text>
                )}
              </LinearGradient>
            )}
          </View>
          <View style={styles.userInfoContainer}>
            {userData.name ? (
              <Text style={styles.userName}>{userData.name}</Text>
            ) : (
              <Text style={styles.userName}>Guest</Text>
            )}
            {userData.userId ? (
              <View style={styles.userIdContainer}>
                <Text style={styles.userIdText}>{userData.userId}</Text>
                {!isUserIdCopied ? (
                  <TouchableOpacity onPress={copyUserIdToClipboard}>
                    <Icon name="copy" size={20} color="white" />
                  </TouchableOpacity>
                ) : null}
                {isUserIdCopied && (
                  <Icon
                    name="checkmark-circle-outline"
                    size={20}
                    color="white"
                    style={styles.doneIcon}
                  />
                )}
              </View>
            ) : null}
          </View>
        </LinearGradient>
        {/* </ImageBackground> */}

        {/* Navigation Items... */}
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => props.navigation.navigate('Dashboard')}>
          <Icon name="grid" size={24} color="#333" />
          <Text style={styles.drawerText}>Dashboard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => props.navigation.navigate('Profile')}>
          <Icon name="person" size={24} color="#333" />
          <Text style={styles.drawerText}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => props.navigation.navigate('Currency')}>
          <Icon name="cash" size={24} color="#333" />
          <Text style={styles.drawerText}>Currency</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.drawerItem}
          onPress={toggleAddMemberOption}>
          <Icon name="people" size={24} color="#333" />
          <View style={styles.membersContainer}>
            <Text style={styles.drawerText}>Members</Text>
            <Icon
              name={
                showAddMemberOption ? 'caret-up-outline' : 'caret-down-outline'
              }
              size={15}
              color="#333"
              style={styles.caretIcon}
            />
          </View>
        </TouchableOpacity>

        {showAddMemberOption && (
          <>
            <View style={styles.membersList}>
              <ScrollView>
                {members.length > 0 ? (
                  members.map(member => {
                    const isBase64Image =
                      member.avatar && member.avatar.startsWith('data:image/');
                    if (member.avatar && !isBase64Image) {
                      member.avatar = `data:image/jpeg;base64,${member.avatar}`;
                    }
                    return (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.memberContainer}
                        onPress={() => handleMemberPress(member.id)}>
                        <>
                          <Icon
                            name="person"
                            size={20}
                            color="#333"
                            style={styles.memberIcon}
                          />
                          {/* <Image
                            source={{
                              uri:
                                member.avatar ||
                                require('../assets/image/AppLogo.webp'),
                            }}
                            style={styles.avatar} 
                          /> */}

                          <Text style={styles.memberName}>{member.name}</Text>
                        </>

                        {/* Remove button with loading indicator */}
                        <TouchableOpacity
                          onPress={e => {
                            e.stopPropagation();
                            handleRemoveMember(member.id);
                          }}
                          style={styles.removeButton}>
                          {loadingMember === member.id ? (
                            <ActivityIndicator size="small" color="#333" />
                          ) : (
                            <Icon name="trash-outline" size={18} color="red" />
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.noMembersText}>No members found.</Text>
                )}

                {/* Show the "Total" button only if there are members */}
                {members.length > 0 && (
                  <TouchableOpacity
                    style={styles.subDrawerItem}
                    onPress={handleTotalPress}
                    disabled={loading}>
                    {loading ? (
                      <View
                        style={{
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                        <ActivityIndicator size="small" color="#00796b" />
                      </View>
                    ) : (
                      <>
                        <Icon
                          name="list"
                          size={20}
                          color="#333"
                          style={styles.caretIcon}
                        />
                        <Text style={styles.subDrawerText}>Total Summary</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.subDrawerItem}
                  onPress={() => setModalVisible(true)}>
                  <Icon name="person-add" size={20} color="#333" />
                  <Text style={styles.subDrawerText}>Add Member</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </>
        )}
        <TouchableOpacity
          style={styles.drawerItem}
          onPress={() => props.navigation.navigate('About')}>
          {/* <View style={{backgroundColor: '#E0F2F1', padding: 5, borderRadius: 8}}> */}
          <Icon name="information-circle" size={24} color="#333" />
          {/* </View> */}
          <Text style={styles.drawerText}>About</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={handleShare}>
          <Icon name="share-social" size={24} color="#333" />

          <Text style={styles.drawerText}>Share</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerItem} onPress={handleLogout}>
          <Icon name="log-out" size={24} color="#333" />
          <Text style={styles.drawerText}>Logout</Text>
        </TouchableOpacity>
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <TextInput
                style={styles.input}
                placeholder="Enter code to read others data"
                value={newMemberId}
                onChangeText={setNewMemberId}
                placeholderTextColor="#aaa"
              />
              <View style={{flexDirection: 'row'}}>
                <TouchableOpacity
                  style={[styles.addButton]}
                  onPress={loading ? null : handleAddMember} // Disable button when loading
                  disabled={loading} // Prevent interaction during loading
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addButtonText}>Add</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}>
                  <Text style={styles.closeButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
      <View style={styles.appNameTextContainer}>
        <Text style={{fontSize: 18, color: 'grey'}}>Family</Text>
        <Text style={{fontSize: 16, fontWeight: 'normal', color: 'grey'}}>
          Income Expense Manager
        </Text>
      </View>
    </CustomStatusBar>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  firstBackground: {
    flex: 1,
    resizeMode: 'cover', // Ensures the image covers the entire background
  },
  secondBackground: {
    flex: 1,
    resizeMode: 'cover', // Ensures the second image overlays correctly
    opacity: 0.8, // Slight transparency for the second image
  },
  initialsContainer: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    backgroundColor: '#00796b',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginVertical: height * 0.02,
  },
  initialsText: {
    fontSize: width * 0.1,
    color: '#fff',
    fontWeight: 'bold',
  },
  avatarContainer: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: (width * 0.25) / 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.01,
    backgroundColor: '#00796b',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: (width * 0.25) / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  background: {
    alignItems: 'flex-start',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.03,
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 15,
    backgroundColor: '#00796B',
  },
  headerContainer: {
    alignItems: 'flex-start',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    width: '100%',
    backgroundColor: '#17B4A2',
    borderBottomRightRadius: 15,
    borderBottomLeftRadius: 15,
  },
  appLogo: {
    width: width * 0.2,
    height: width * 0.2,
    borderRadius: (width * 0.2) / 2,
    marginBottom: height * 0.01,
  },
  userInfoContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(52, 52, 52, 0.3)',
    padding: height * 0.01,
    borderRadius: 10,
  },
  userIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: width * 0.045,
    fontWeight: 'bold',
    color: '#fff',
    alignSelf: 'flex-start',
  },
  userIdText: {
    fontSize: width * 0.03,
    color: '#fff',
    marginRight: width * 0.02,
  },
  doneIcon: {
    marginLeft: 0,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  caretIcon: {
    marginLeft: 10,
  },
  membersList: {
    flex: 1,
    paddingVertical: height * 0.0,
    backgroundColor: '#F0F4F4',
    maxHeight: height * 0.4,
    paddingHorizontal: width * 0.02,
  },
  membersScrollContainer: {
    paddingBottom: 20,
  },
  subDrawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  subDrawerText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  drawerText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.03,
    color: '#333',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: width * 0.0,
    flex: 1,
  },
  memberIcon: {
    marginRight: width * 0.02,
  },
  memberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: height * 0.01,
    marginVertical: height * 0.002,
    marginHorizontal: width * 0.0,
    backgroundColor: '#5BB5AB',
    borderRadius: 10,
  },
  avatar: {
    width: 40, // Set appropriate size
    height: 40,
    borderRadius: 25, // Make it circular
    marginRight: 10, // Space between avatar and text
  },
  memberName: {
    fontSize: width * 0.04,
    color: 'black',
  },
  removeButton: {
    marginLeft: 'auto',
    padding: width * 0.02,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMembersText: {
    textAlign: 'center',
    color: '#666',
    fontSize: width * 0.04,
    marginTop: height * 0.02,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: width * 0.08,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: width * 0.06,
    marginBottom: height * 0.02,
  },
  input: {
    width: '100%',
    height: height * 0.05,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.03,
    color: '#000',
  },
  addButton: {
    backgroundColor: '#00796b',
    borderRadius: 10,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    alignItems: 'center',
    marginRight: width * 0.02,
  },
  addButtonText: {
    color: 'white',
    fontSize: width * 0.04,
  },
  closeButton: {
    backgroundColor: '#f08080',
    borderRadius: 10,
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    alignItems: 'center',
    marginLeft: width * 0.02,
  },
  closeButtonText: {
    color: 'white',
    fontSize: width * 0.04,
  },
  appNameTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
});

export default CustomDrawerContent;
