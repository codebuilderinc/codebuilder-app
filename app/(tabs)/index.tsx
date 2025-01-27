import { Pressable, Image, StyleSheet, Button, ScrollView } from "react-native";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";
import { triggerLocalSampleNotification } from "../../utils/notifications";
import LocationComponent from "../../components/Location";

export default function TabOneScreen() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Tab One</Text>
        <Button
          title="Send Notification"
          onPress={triggerLocalSampleNotification}
        />
        <View
          style={styles.separator}
          lightColor="#eee"
          darkColor="rgba(255,255,255,0.1)"
        />
        <View style={styles.content}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={imgStyles.image}
          />
          <Text style={styles.text}>Welcome to TailwindCSS in Expo!2</Text>
          <Button title="Press Me" onPress={() => alert("Hello!")} />
        </View>
        <LocationComponent />
        <EditScreenInfo path="app/(tabs)/index.tsx" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: 16, // Optional: add padding around the scrollable content
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
    padding: 16, // Optional: add padding inside the content container
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e40af",
    marginVertical: 10,
  },
});

const imgStyles = StyleSheet.create({
  image: {
    width: 200, // Adjust as needed
    height: 200, // Adjust as needed
    resizeMode: "contain", // Optional: Adjust image resizing behavior
  },
});
