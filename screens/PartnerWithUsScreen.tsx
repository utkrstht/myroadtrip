import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Platform, useWindowDimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../context/ThemeContext';
import { SPACING } from '../utils/constants';

interface PartnerWithUsScreenProps {
  navigation: any;
}

type PartnerTab = 'hotel' | 'driver';

type FileItem = {
  name: string;
  size?: number;
  type?: string;
  base64?: string;
};

type SelectOption = {
  label: string;
  value: string;
};

type ApiResponsePayload = {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: any;
};

const CURRENT_YEAR = new Date().getFullYear();

const TAB_COPY: Record<PartnerTab, { title: string; subtitle: string; icon: string }> = {
  hotel: {
    title: 'Hotel Partnership',
    subtitle: 'Partner with MyRoadTrip to deliver seamless transportation for your guests.',
    icon: 'business',
  },
  driver: {
    title: 'Chauffeur Application',
    subtitle: 'Partner with MyRoadTrip as a professional chauffeur and grow with our fleet.',
    icon: 'directions-car',
  },
};

const WORK_AUTHORIZATION_OPTIONS: SelectOption[] = [
  { label: 'Canadian citizen', value: 'Canadian citizen' },
  { label: 'Permanent resident', value: 'Permanent resident' },
  { label: 'Open work permit', value: 'Open work permit' },
  { label: 'Employer-specific work permit', value: 'Employer-specific work permit' },
  { label: 'Other', value: 'Other' },
];

const TIME_AVAILABILITY_OPTIONS: SelectOption[] = [
  { label: 'Weekdays', value: 'Weekdays' },
  { label: 'Weekends', value: 'Weekends' },
  { label: 'Evenings', value: 'Evenings' },
  { label: 'Overnights', value: 'Overnights' },
  { label: 'Flexible / on-call', value: 'Flexible / on-call' },
];

const PASSENGER_CAPACITY_OPTIONS: SelectOption[] = ['4', '5', '6', '7', '8', '10', '12', '14'].map((value) => ({
  label: value,
  value,
}));

const SEATING_TYPE_OPTIONS: SelectOption[] = [
  { label: 'Bench', value: 'Bench' },
  { label: 'Captain chairs', value: 'Captain chairs' },
  { label: 'Split bench', value: 'Split bench' },
  { label: 'Executive seating', value: 'Executive seating' },
  { label: 'Other', value: 'Other' },
];

const COLOR_OPTIONS: SelectOption[] = [
  { label: 'Black', value: 'Black' },
  { label: 'White', value: 'White' },
  { label: 'Silver', value: 'Silver' },
  { label: 'Grey', value: 'Grey' },
  { label: 'Blue', value: 'Blue' },
  { label: 'Other', value: 'Other' },
];

const EXTERIOR_COLOR_OPTIONS: SelectOption[] = [{ label: 'Black', value: 'Black' }];

const PROVINCE_OPTIONS: SelectOption[] = [
  { label: 'Alberta', value: 'Alberta' },
  { label: 'British Columbia', value: 'British Columbia' },
  { label: 'Manitoba', value: 'Manitoba' },
  { label: 'New Brunswick', value: 'New Brunswick' },
  { label: 'Newfoundland and Labrador', value: 'Newfoundland and Labrador' },
  { label: 'Nova Scotia', value: 'Nova Scotia' },
  { label: 'Ontario', value: 'Ontario' },
  { label: 'Prince Edward Island', value: 'Prince Edward Island' },
  { label: 'Quebec', value: 'Quebec' },
  { label: 'Saskatchewan', value: 'Saskatchewan' },
];

const VEHICLE_YEAR_OPTIONS: SelectOption[] = Array.from({ length: CURRENT_YEAR - 2007 }, (_, index) => {
  const year = CURRENT_YEAR - index;
  return { label: String(year), value: String(year) };
});

const INVOICING_OPTIONS: SelectOption[] = [
  { label: 'Yes', value: 'Yes' },
  { label: 'No', value: 'No' },
  { label: 'On request', value: 'On request' },
];

const VEHICLE_IMAGE_FIELDS = [
  { key: 'exteriorFront', label: 'Exterior (front)', required: true, helper: 'Upload a clear front view of the vehicle.', multiple: true },
  { key: 'exteriorRear', label: 'Exterior (rear)', required: true, helper: 'Upload a clear rear view of the vehicle.', multiple: true },
  { key: 'exteriorSides', label: 'Exterior (sides)', required: true, helper: 'Upload side-angle images showing the full profile.', multiple: true },
  { key: 'interiorFirstRow', label: 'Interior (first row)', required: true, helper: 'Show the front cabin and seating.', multiple: true },
  { key: 'interiorSecondRow', label: 'Interior (second row)', required: true, helper: 'Show the second-row seating area.', multiple: true },
  { key: 'interiorLastRow', label: 'Interior (last row)', required: false, helper: 'Optional: upload the rearmost seating area.', multiple: true },
];

const DRIVER_DOC_FIELDS = [
  { key: 'drivingLicense', label: 'Driving License (front + back)', required: true, helper: 'Upload both sides of the license.', multiple: true },
  { key: 'commercialInsurance', label: 'Commercial Vehicle Insurance', required: true, helper: 'Upload all active insurance pages.', multiple: true },
  { key: 'vehicleRegistration', label: 'Vehicle Registration', required: true, helper: 'Upload the vehicle registration document.', multiple: true },
  { key: 'otherCertification', label: 'Other Certification or License', required: false, helper: 'Optional supporting documents.', multiple: true },
];

const parseApiResponse = async (response: Response): Promise<{ data: ApiResponsePayload; rawText: string }> => {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return { data: {}, rawText };
  }

  try {
    const parsed = JSON.parse(rawText);

    if (parsed && typeof parsed === 'object') {
      return { data: parsed as ApiResponsePayload, rawText };
    }

    return { data: {}, rawText };
  } catch {
    return { data: { error: rawText.trim() }, rawText };
  }
};

export default function PartnerWithUsScreen({ navigation }: PartnerWithUsScreenProps) {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const { width } = useWindowDimensions();

  const isWide = width >= 980;
  const isMedium = width >= 700;
  const columnWidth = isWide ? '32%' : isMedium ? '48%' : '100%';

  const [activeTab, setActiveTab] = useState<PartnerTab>('hotel');
  const [openSelect, setOpenSelect] = useState<string | null>(null);

  const [hotelName, setHotelName] = useState('');
  const [hotelContactName, setHotelContactName] = useState('');
  const [hotelEmail, setHotelEmail] = useState('');
  const [hotelPhone, setHotelPhone] = useState('');
  const [hotelNotes, setHotelNotes] = useState('');
  const [hotelLoading, setHotelLoading] = useState(false);

  const [driverFirstName, setDriverFirstName] = useState('');
  const [driverLastName, setDriverLastName] = useState('');
  const [driverEmail, setDriverEmail] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [cityOfResidence, setCityOfResidence] = useState('');
  const [workAuthorization, setWorkAuthorization] = useState('');
  const [timeAvailability, setTimeAvailability] = useState('');
  const [provinceState, setProvinceState] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState('');
  const [referralName, setReferralName] = useState('');
  const [vehicleMakeAndModel, setVehicleMakeAndModel] = useState('');
  const [passengerCapacity, setPassengerCapacity] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');
  const [seatingType, setSeatingType] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [registeredBusinessName, setRegisteredBusinessName] = useState('');
  const [onlineInvoicing, setOnlineInvoicing] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [confirmInsurance, setConfirmInsurance] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverFiles, setDriverFiles] = useState<Record<string, FileItem[]>>({});
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const readFileAsBase64FromUri = async (uri: string): Promise<string> => {
    try {
      const base64Content = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return base64Content;
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  };

  const pickFiles = async (fieldKey: string, multiple: boolean) => {
    setUploadingField(fieldKey);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: true,
        allowsMultipleSelection: multiple,
        selectionLimit: multiple ? 0 : 1,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setUploadingField(null);
        return;
      }

      // For fields that support multiple, take all selected assets. For single fields, take the first.
      const assetsToProcess = multiple ? result.assets : [result.assets[0]];

      const fileItems: FileItem[] = await Promise.all(
        assetsToProcess.map(async (asset: any) => {
          try {
            let base64Content = asset.base64 || '';

            if (!base64Content && asset.uri) {
              base64Content = await readFileAsBase64FromUri(asset.uri);
            }

            return {
              name: asset.fileName || asset.name || 'document',
              size: asset.fileSize || asset.size,
              type: asset.type || asset.mimeType || 'application/octet-stream',
              base64: base64Content,
            };
          } catch (error) {
            console.error(`Failed to process ${asset.name || asset.fileName}:`, error);
            Alert.alert('Error', `Failed to process ${asset.fileName || asset.name || 'file'}`);
            throw error;
          }
        }),
      );

      updateDriverFiles(fieldKey, fileItems);
    } catch (error: any) {
      // User cancelled or error occurred
      if (!error?.message?.includes('cancelled')) {
        console.error('File picker error:', error);
        Alert.alert('Error', 'Failed to pick files. Please try again.');
      }
    } finally {
      setUploadingField(null);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64 || '');
      };

      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const toFileItems = async (fileList: FileList | null): Promise<FileItem[]> => {
    if (!fileList) {
      return [];
    }

    const files = Array.from(fileList);
    return Promise.all(
      files.map(async (file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        base64: await readFileAsBase64(file),
      })),
    );
  };

  const updateDriverFiles = (key: string, files: FileItem[]) => {
    setDriverFiles((current) => ({
      ...current,
      [key]: files,
    }));
  };

  const renderTextField = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    required = false,
    keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default',
  ) => (
    <View style={[styles.field, { width: columnWidth }]}> 
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.requiredStar}>*</Text> : null}
      </Text>
      <View style={styles.inputShell}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
          placeholderTextColor={theme.colors.subText}
        />
      </View>
    </View>
  );

  const renderTextArea = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    required = false,
  ) => (
    <View style={styles.fullWidthField}>
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.requiredStar}>*</Text> : null}
      </Text>
      <View style={[styles.inputShell, styles.textAreaShell]}>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.subText}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
      </View>
    </View>
  );

  const renderSelect = (
    key: string,
    label: string,
    value: string,
    onSelect: (value: string) => void,
    options: SelectOption[],
    placeholder = 'Select an option',
    required = false,
  ) => (
    <View style={[styles.field, { width: columnWidth }]}> 
      <Text style={styles.label}>
        {label} {required ? <Text style={styles.requiredStar}>*</Text> : null}
      </Text>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setOpenSelect(openSelect === key ? null : key)}
        style={styles.selectField}
      >
        <Text style={[styles.selectText, !value && styles.placeholderText]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <MaterialIcons name={openSelect === key ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={22} color={theme.colors.subText} />
      </TouchableOpacity>

      {openSelect === key ? (
        <View style={styles.optionsPanel}>
          {options.map((option) => (
            <TouchableOpacity
              key={option.value}
              activeOpacity={0.75}
              onPress={() => {
                onSelect(option.value);
                setOpenSelect(null);
              }}
              style={[styles.optionRow, value === option.value && styles.optionRowActive]}
            >
              <Text style={[styles.optionText, value === option.value && styles.optionTextActive]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );

  const renderUploadField = (field: { key: string; label: string; required: boolean; helper: string; multiple: boolean }) => {
    const files = driverFiles[field.key] || [];
    const isUploading = uploadingField === field.key;

    return (
      <View key={field.key} style={[styles.field, styles.uploadField, { width: columnWidth }]}> 
        <Text style={styles.label}>
          {field.label} {field.required ? <Text style={styles.requiredStar}>*</Text> : null}
        </Text>
        <View style={styles.uploadCard}>
          <TouchableOpacity
            activeOpacity={0.88}
            disabled={isUploading}
            onPress={() => {
              if (Platform.OS === 'web') {
                // Web uses native input
                return;
              }
              pickFiles(field.key, field.multiple);
            }}
            style={[styles.uploadAction, isUploading && styles.uploadActionDisabled]}
          >
            {isUploading ? (
              <ActivityIndicator size="large" color={theme.colors.gold} />
            ) : (
              <>
                <MaterialIcons name="upload-file" size={38} color={theme.colors.gold} />
                <Text style={styles.uploadTitle}>
                  {Platform.OS === 'web' ? 'Click or drag files to upload' : 'Tap to select files'}
                </Text>
                <Text style={styles.uploadHelper}>{field.helper}</Text>
                <Text style={styles.uploadCount}>{field.multiple ? 'Multiple files supported' : 'Single file upload'}</Text>
              </>
            )}
            {files.length > 0 ? (
              <View style={styles.fileList}>
                {files.map((file) => (
                  <Text key={file.name} style={styles.fileChip} numberOfLines={1}>
                    {file.name}
                  </Text>
                ))}
              </View>
            ) : null}
          </TouchableOpacity>

          {Platform.OS === 'web'
            ? React.createElement('input', {
                type: 'file',
                multiple: field.multiple,
                style: {
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                },
                onChange: async (event: any) => {
                  try {
                    const parsedFiles = await toFileItems(event.target.files);
                    updateDriverFiles(field.key, parsedFiles);
                  } catch (error) {
                    console.error('File read error:', error);
                    Alert.alert('Upload Error', 'Unable to process one or more files. Please try again.');
                  }
                },
              })
            : null}
        </View>
      </View>
    );
  };

  const resetHotelForm = () => {
    setHotelName('');
    setHotelContactName('');
    setHotelEmail('');
    setHotelPhone('');
    setHotelNotes('');
  };

  const resetDriverForm = () => {
    setDriverFirstName('');
    setDriverLastName('');
    setDriverEmail('');
    setDriverPhone('');
    setCityOfResidence('');
    setWorkAuthorization('');
    setTimeAvailability('');
    setProvinceState('');
    setLanguagesSpoken('');
    setReferralName('');
    setVehicleMakeAndModel('');
    setPassengerCapacity('');
    setExteriorColor('');
    setVehicleYear('');
    setSeatingType('');
    setInteriorColor('');
    setGstNumber('');
    setRegisteredBusinessName('');
    setOnlineInvoicing('');
    setImportantNotes('');
    setConfirmInsurance(false);
    setConfirmAccuracy(false);
    setDriverFiles({});
  };

  const handleHotelSubmit = async () => {
    if (!hotelName || !hotelContactName || !hotelEmail || !hotelPhone) {
      Alert.alert('Missing Information', 'Please complete the hotel partnership details.');
      return;
    }

    setHotelLoading(true);

    try {
      const response = await fetch('https://partner-with-us-rrd.vercel.app/api/partner-with-us.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelName,
          propertyName: hotelName,
          contactName: hotelContactName,
          hotelContactName,
          email: hotelEmail,
          hotelEmail,
          mobile: hotelPhone,
          phone: hotelPhone,
          hotelPhone,
          message: hotelNotes,
          notes: hotelNotes,
          hotelNotes,
        }),
      });

      const { data, rawText } = await parseApiResponse(response);

      if (response.ok && data.success) {
        Alert.alert('Success', 'Your hotel partnership request has been sent.', [
          {
            text: 'OK',
            onPress: () => {
              resetHotelForm();
              navigation.navigate('Home');
            },
          },
        ]);
      } else {
        const errorMessage = data.error || data.message || (!response.ok ? `Request failed (${response.status})` : '') || 'Something went wrong. Please try again.';
        Alert.alert('Error', errorMessage);
        if (!response.ok || !data.success) {
          console.warn('Hotel submission response was not successful:', { status: response.status, body: rawText });
        }
      }
    } catch (error) {
      console.error('Hotel submission error:', error);
      Alert.alert('Error', 'Failed to submit the hotel form. Please check your connection and try again.');
    } finally {
      setHotelLoading(false);
    }
  };

  const handleDriverSubmit = async () => {
    const missingFields: string[] = [];

    if (!driverFirstName) missingFields.push('First name');
    if (!driverLastName) missingFields.push('Last name');
    if (!driverEmail) missingFields.push('Email');
    if (!driverPhone) missingFields.push('Phone');
    if (!cityOfResidence) missingFields.push('City of residence');
    if (!workAuthorization) missingFields.push('Work authorization');
    if (!timeAvailability) missingFields.push('Time availability');
    if (!provinceState) missingFields.push('Province/state');
    if (!languagesSpoken) missingFields.push('Languages spoken');
    if (!vehicleMakeAndModel) missingFields.push('Vehicle make and model');
    if (!passengerCapacity) missingFields.push('Passenger seating capacity');
    if (!exteriorColor) missingFields.push('Exterior colour');
    if (!vehicleYear) missingFields.push('Vehicle year');
    if (!interiorColor) missingFields.push('Interior colour');
    if (!driverFiles.exteriorFront?.length) missingFields.push('Exterior front image');
    if (!driverFiles.exteriorRear?.length) missingFields.push('Exterior rear image');
    if (!driverFiles.exteriorSides?.length) missingFields.push('Exterior side images');
    if (!driverFiles.interiorFirstRow?.length) missingFields.push('Interior first row image');
    if (!driverFiles.interiorSecondRow?.length) missingFields.push('Interior second row image');
    if (!driverFiles.drivingLicense?.length) missingFields.push('Driving license');
    if (!driverFiles.commercialInsurance?.length) missingFields.push('Commercial insurance');
    if (!gstNumber) missingFields.push('GST/HST/QST/Tax number');
    if (!onlineInvoicing) missingFields.push('Online invoicing & card payments');
    if (!driverFiles.vehicleRegistration?.length) missingFields.push('Vehicle registration');
    if (!confirmInsurance) missingFields.push('Insurance confirmation');
    if (!confirmAccuracy) missingFields.push('Accuracy confirmation');

    if (missingFields.length > 0) {
      Alert.alert('Missing Information', `Please complete the required fields: ${missingFields.join(', ')}.`);
      return;
    }

    setDriverLoading(true);

    try {
      const response = await fetch('https://driver-proxy-three.vercel.app/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: driverFirstName,
          lastName: driverLastName,
          email: driverEmail,
          mobile: driverPhone,
          cityOfResidence,
          workAuthorization,
          timeAvailability,
          provinceState,
          languagesSpoken,
          referralName,
          vehicleMakeAndModel,
          passengerCapacity,
          exteriorColor,
          vehicleYear,
          seatingType,
          interiorColor,
          gstNumber,
          registeredBusinessName,
          onlineInvoicing,
          importantNotes,
          confirmInsurance,
          confirmAccuracy,
          files: driverFiles,
        }),
      });

      const { data, rawText } = await parseApiResponse(response);

      if (response.ok && data.success) {
        Alert.alert('Success', 'Your chauffeur application has been sent.', [
          {
            text: 'OK',
            onPress: () => {
              resetDriverForm();
              navigation.navigate('Home');
            },
          },
        ]);
      } else {
        const errorMessage = data.error || data.message || (!response.ok ? `Request failed (${response.status})` : '') || 'Something went wrong. Please try again.';
        Alert.alert('Error', errorMessage);
        if (!response.ok || !data.success) {
          console.warn('Driver submission response was not successful:', { status: response.status, body: rawText });
        }
      }
    } catch (error) {
      console.error('Driver submission error:', error);
      Alert.alert('Error', 'Failed to submit the chauffeur application. Please check your connection and try again.');
    } finally {
      setDriverLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (activeTab === 'hotel') {
      await handleHotelSubmit();
      return;
    }

    await handleDriverSubmit();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[theme.colors.white, '#f6f1e7']} style={styles.hero}>
          <Text
            style={[
              styles.headerTitle,
              { fontSize: isWide ? 30 : isMedium ? 25 : 19, lineHeight: isWide ? 36 : isMedium ? 30 : 24 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Partner with MyRoadTrip
          </Text>
          <Text style={styles.description}>
            Partner with MyRoadTrip for trusted hotel collaborations and chauffeur opportunities.
          </Text>

          <View style={styles.tabRail}>
            {(['hotel', 'driver'] as PartnerTab[]).map((tab) => {
              const active = activeTab === tab;

              return (
                <TouchableOpacity
                  key={tab}
                  activeOpacity={0.9}
                  onPress={() => {
                    setActiveTab(tab);
                    setOpenSelect(null);
                  }}
                  style={[styles.tabButton, active && styles.tabButtonActive]}
                >
                  <MaterialIcons name={TAB_COPY[tab].icon as any} size={18} color={active ? theme.colors.white : theme.colors.subText} />
                  <Text
                    style={[styles.tabButtonText, { fontSize: isMedium ? 14 : 12 }, active && styles.tabButtonTextActive]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {TAB_COPY[tab].title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>

        <View style={styles.formCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeadingBlock}>
              <Text style={styles.cardTitle}>{TAB_COPY[activeTab].title}</Text>
              <Text style={styles.cardSubtitle}>{TAB_COPY[activeTab].subtitle}</Text>
            </View>
            <View style={styles.cardPill}>
              <Text style={styles.cardPillText}>{activeTab === 'hotel' ? 'Quick form' : 'Application'}</Text>
            </View>
          </View>

          {activeTab === 'hotel' ? (
            <View>
              <View style={styles.gridRow}>
                {renderTextField('Hotel / Property Name', hotelName, setHotelName, 'Enter hotel name', true)}
                {renderTextField('Contact Person', hotelContactName, setHotelContactName, 'Enter contact name', true)}
                {renderTextField('Email', hotelEmail, setHotelEmail, 'Enter email address', true, 'email-address')}
              </View>

              <View style={styles.gridRow}>
                {renderTextField('Phone', hotelPhone, setHotelPhone, 'Enter phone number', true, 'phone-pad')}
              </View>

              {renderTextArea('Notes / Proposal', hotelNotes, setHotelNotes, 'Tell us about your property, preferred contact method, or partnership goals.')}

              <TouchableOpacity
                style={[styles.submitButton, hotelLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={hotelLoading}
              >
                <Text style={styles.submitButtonText}>{hotelLoading ? 'Sending...' : 'Submit Hotel Inquiry'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Contact Details</Text>
                <Text style={styles.sectionNote}>The fields below match the chauffeur registration screenshots.</Text>
              </View>

              <View style={styles.gridRow}>
                {renderTextField('First Name', driverFirstName, setDriverFirstName, 'First name', true)}
                {renderTextField('Last Name', driverLastName, setDriverLastName, 'Last name', true)}
                {renderTextField('Email', driverEmail, setDriverEmail, 'Email address', true, 'email-address')}
              </View>

              <View style={styles.gridRow}>
                {renderTextField('Phone', driverPhone, setDriverPhone, 'Phone number', true, 'phone-pad')}
                {renderTextField('City of Residence', cityOfResidence, setCityOfResidence, 'Enter city of residence', true)}
                {renderSelect('workAuthorization', 'Work Authorization', workAuthorization, setWorkAuthorization, WORK_AUTHORIZATION_OPTIONS, 'Select an option', true)}
              </View>

              <View style={styles.gridRow}>
                {renderSelect('timeAvailability', 'Time Availability', timeAvailability, setTimeAvailability, TIME_AVAILABILITY_OPTIONS, 'Select an option', true)}
                {renderSelect('provinceState', 'Province/State', provinceState, setProvinceState, PROVINCE_OPTIONS, 'Select an option', true)}
                {renderTextField('Languages Spoken', languagesSpoken, setLanguagesSpoken, 'List the languages you speak', true)}
              </View>

              <View style={styles.gridRow}>
                {renderTextField('Referral Name', referralName, setReferralName, 'Optional referral name')}
                {renderTextArea('Important Notes (if any)', importantNotes, setImportantNotes, 'Add anything helpful about your availability or vehicle.')}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vehicle Details</Text>
              </View>

              <View style={styles.gridRow}>
                {renderTextField('Vehicle Make and Model', vehicleMakeAndModel, setVehicleMakeAndModel, 'Enter make and model', true)}
                {renderSelect('passengerCapacity', 'Passenger Seating Capacity', passengerCapacity, setPassengerCapacity, PASSENGER_CAPACITY_OPTIONS, 'Select an option', true)}
                {renderSelect('exteriorColor', 'Exterior Colour', exteriorColor, setExteriorColor, EXTERIOR_COLOR_OPTIONS, 'Select an option', true)}
              </View>

              <View style={styles.gridRow}>
                {renderSelect('vehicleYear', 'Vehicle Year', vehicleYear, setVehicleYear, VEHICLE_YEAR_OPTIONS, 'Select an option', true)}
                {renderSelect('seatingType', 'Seating Type (mid-row)', seatingType, setSeatingType, SEATING_TYPE_OPTIONS, 'Select an option')}
                {renderSelect('interiorColor', 'Interior Colour', interiorColor, setInteriorColor, COLOR_OPTIONS, 'Select an option', true)}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vehicle Images</Text>
              </View>

              <View style={styles.gridRow}>
                {VEHICLE_IMAGE_FIELDS.slice(0, 3).map(renderUploadField)}
              </View>

              <View style={styles.gridRow}>
                {VEHICLE_IMAGE_FIELDS.slice(3).map(renderUploadField)}
              </View>

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Documentation</Text>
              </View>

              <View style={styles.gridRow}>
                {renderUploadField(DRIVER_DOC_FIELDS[0])}
                {renderUploadField(DRIVER_DOC_FIELDS[1])}
                {renderTextField('GST/HST/QST/Tax Number', gstNumber, setGstNumber, 'Enter tax number', true)}
              </View>

              <View style={styles.gridRow}>
                {renderTextField('Registered Business Name', registeredBusinessName, setRegisteredBusinessName, 'Optional business name')}
                {renderSelect('onlineInvoicing', 'Online Invoicing & Card Payments', onlineInvoicing, setOnlineInvoicing, INVOICING_OPTIONS, 'Select an option', true)}
                {renderUploadField(DRIVER_DOC_FIELDS[2])}
              </View>

              <View style={styles.gridRow}>
                {renderUploadField(DRIVER_DOC_FIELDS[3])}
              </View>

              <View style={styles.confirmationGroup}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setConfirmInsurance((current) => !current)} style={styles.checkboxRow}>
                  <View style={[styles.checkbox, confirmInsurance && styles.checkboxActive]}>
                    {confirmInsurance ? <MaterialIcons name="check" size={14} color={theme.colors.white} /> : null}
                  </View>
                  <Text style={styles.checkboxText}>
                    I confirm that I hold valid Commercial Limousine Insurance that provides full coverage for all trips that may be offered by MyRoadTrip YYC Travels.
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.85} onPress={() => setConfirmAccuracy((current) => !current)} style={styles.checkboxRow}>
                  <View style={[styles.checkbox, confirmAccuracy && styles.checkboxActive]}>
                    {confirmAccuracy ? <MaterialIcons name="check" size={14} color={theme.colors.white} /> : null}
                  </View>
                  <Text style={styles.checkboxText}>
                    I consent to the submission and sharing of my documents with MyRoadTrip YYC Travels for verification purposes and declare that all documents provided are accurate, current, and authentic.
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, driverLoading && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={driverLoading}
              >
                <Text style={styles.submitButtonText}>{driverLoading ? 'Sending...' : 'Submit Application'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f1e7',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  hero: {
    margin: SPACING.lg,
    borderRadius: 28,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.18)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 4,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.14)',
    marginBottom: SPACING.md,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.gold,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.primary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.subText,
    maxWidth: 920,
  },
  tabRail: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    marginTop: SPACING.lg,
  },
  tabButton: {
    minHeight: 54,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.subText,
    flexShrink: 1,
  },
  tabButtonTextActive: {
    color: theme.colors.white,
  },
  formCard: {
    marginHorizontal: SPACING.lg,
    marginTop: 2,
    marginBottom: SPACING.xl,
    backgroundColor: theme.colors.white,
    borderRadius: 28,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 22,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cardHeadingBlock: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: theme.colors.subText,
    lineHeight: 18,
  },
  cardPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  cardPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.gold,
  },
  sectionHeader: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: 4,
  },
  sectionNote: {
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.subText,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  field: {
    marginBottom: SPACING.lg,
  },
  fullWidthField: {
    width: '100%',
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: SPACING.sm,
  },
  requiredStar: {
    color: '#cf3b3b',
  },
  inputShell: {
    minHeight: 56,
    backgroundColor: '#fbfbfb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 0,
  },
  textAreaShell: {
    minHeight: 140,
    alignItems: 'stretch',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 110,
  },
  selectField: {
    minHeight: 56,
    backgroundColor: '#fbfbfb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    paddingVertical: 17,
  },
  placeholderText: {
    color: theme.colors.subText,
  },
  optionsPanel: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    backgroundColor: theme.colors.white,
  },
  optionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionRowActive: {
    backgroundColor: 'rgba(212, 175, 55, 0.10)',
  },
  optionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  optionTextActive: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  uploadField: {
    position: 'relative',
  },
  uploadCard: {
    minHeight: 180,
    backgroundColor: '#fbfbfb',
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.12)',
    overflow: 'hidden',
  },
  uploadAction: {
    flex: 1,
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    gap: 6,
  },
  uploadActionDisabled: {
    opacity: 0.6,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
  },
  uploadHelper: {
    fontSize: 12,
    color: theme.colors.subText,
    textAlign: 'center',
    lineHeight: 17,
  },
  uploadCount: {
    fontSize: 12,
    color: theme.colors.gold,
    fontWeight: '700',
    textAlign: 'center',
  },
  fileList: {
    marginTop: 10,
    width: '100%',
    gap: 6,
  },
  fileChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  confirmationGroup: {
    marginTop: 6,
    marginBottom: SPACING.lg,
    gap: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: theme.colors.white,
  },
  checkboxActive: {
    borderColor: theme.colors.gold,
    backgroundColor: theme.colors.gold,
  },
  checkboxText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text,
  },
  submitButton: {
    backgroundColor: theme.colors.gold,
    borderRadius: 16,
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: theme.colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});