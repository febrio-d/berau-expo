import React, { useEffect, useRef, useState } from "react";
import { Alert, LogBox, View } from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";
import * as Location from "expo-location";

LogBox.ignoreLogs(["new NativeEventEmitter"]);

interface LocationData {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const webViewRef = useRef<any>(null);
  const [location, setLocation] = useState<LocationData | null>(null);

  const requestLocationPermission = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Denied",
        "Location access is required for this feature."
      );
      return false;
    }
    return true;
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const { latitude, longitude } = location.coords;
      setLocation({ latitude, longitude });
      updateWebViewUrl(latitude, longitude);
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert("Error", "Could not fetch location. Please try again.");
    }
  };

  const updateWebViewUrl = (latitude: number, longitude: number) => {
    webViewRef.current?.injectJavaScript(`
      (function() {
        let currentUrl = window.location.href;
        const updateQueryParameter = (url, key, value) => {
          const re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
          const separator = url.includes("?") ? "&" : "?";
          if (url.match(re)) {
            return url.replace(re, "$1" + key + "=" + value + "$2");
          } else {
            return url + separator + key + "=" + value;
          }
        };
        currentUrl = updateQueryParameter(currentUrl, "lat", ${latitude});
        currentUrl = updateQueryParameter(currentUrl, "lng", ${longitude});
        window.location.href = currentUrl;
      })();
      true;
    `);
  };

  const onNavigationStateChange = (navState: WebViewNavigation) => {
    if (navState.url.includes("wisata_list.html")) {
      getLocation();
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  return (
    <View style={{ flex: 1, paddingTop: 48 }}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ uri: "http://mobile-berau.netmember.masuk.id" }}
        style={{ flex: 1 }}
        onNavigationStateChange={onNavigationStateChange}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("WebView error: ", nativeEvent);
        }}
      />
    </View>
  );
}
