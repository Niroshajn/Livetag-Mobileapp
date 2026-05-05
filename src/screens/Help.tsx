import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Send,
  Monitor,
  Puzzle,
  ListMusic,
  Settings,
  Shield,
} from "lucide-react-native";
import Layout from "./Layout";

const faqs = [
  {
    category: "Getting Started",
    question: "What is Livetag?",
    answer:
      "Livetag is a digital signage platform that allows you to manage and display content on connected display devices. You can create custom plugins, organize content into playlists, and control what appears on your screens remotely.",
  },
  {
    category: "Getting Started",
    question: "How do I add my first device?",
    answer:
      "Go to the Devices page and click 'Add Device'. Enter the 6-digit code shown on your display device. Once connected, you can start adding content to your device's playlist.",
  },
  {
    category: "Getting Started",
    question: "What are Apps/Plugins?",
    answer:
      "Apps (or Plugins) are customizable content templates that display information on your devices. You can create your own using HTML and Liquid templating, or use existing ones from the community.",
  },
  {
    category: "Devices",
    question: "Why is my device showing as offline?",
    answer:
      "A device shows as offline when it hasn't communicated with our servers recently. Check your device's internet connection, power supply, and ensure the Livetag software is running. The device will automatically reconnect when the connection is restored.",
  },
  {
    category: "Devices",
    question: "How do I rename a device?",
    answer:
      "Click on the device card to open its playlist, then click the settings icon. From there, you can edit the device name and other settings.",
  },
  {
    category: "Playlists",
    question: "How do playlists work?",
    answer:
      "Each device has a playlist that determines what content is displayed. You can add multiple apps to a playlist, set their duration, priority, and schedule when they should appear.",
  },
  {
    category: "Playlists",
    question: "Can I schedule content to appear at specific times?",
    answer:
      "Yes! When adding an app to a playlist, you can set start and end times. The content will only display during those hours.",
  },
  {
    category: "Apps",
    question: "How do I create a custom app?",
    answer:
      "Go to the Developer section and click 'New Plugin'. You'll have access to a visual editor where you can write HTML with Liquid templating, configure data fields, and preview your creation in real-time.",
  },
  {
    category: "Apps",
    question: "What is Liquid templating?",
    answer:
      "Liquid is a templating language that lets you insert dynamic data into your apps. For example, you can display weather data, time, or custom variables using {{ variable_name }} syntax.",
  },
  {
    category: "Account",
    question: "How do I change my password?",
    answer:
      "Go to Account settings, scroll to the Security section, and click 'Change Password'. You'll need to enter your current password and then your new password twice to confirm.",
  },
  {
    category: "Account",
    question: "Can I switch between light and dark themes?",
    answer:
      "Yes! You can toggle between light and dark themes from the sidebar (click the theme switcher) or from Account settings under the Preferences section.",
  },
];

const categories = [
  { name: "all", icon: HelpCircle },
  { name: "Getting Started", icon: HelpCircle },
  { name: "Devices", icon: Monitor },
  { name: "Playlists", icon: ListMusic },
  { name: "Apps", icon: Puzzle },
  { name: "Account", icon: Settings },
];

export default function HelpScreen() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [category, setCategory] = useState("all");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const filtered =
    category === "all"
      ? faqs
      : faqs.filter((f) => f.category === category);

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      Alert.alert("Success", "Message sent!");
    }, 1500);
  };

  const resetForm = () => {
    setForm({ name: "", email: "", subject: "", message: "" });
    setSubmitted(false);
  };

  return (
    <Layout>
      <ScrollView className="flex-1 bg-white dark:bg-[#1a1a1a]  p-4">
        {/* HEADER */}
        <View className="flex-row items-center gap-3 mt-6 mb-5">
          <View className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl items-center justify-center">
            <HelpCircle size={22} color="#3b82f6" />
          </View>
          <View>
            <Text className="text-xl font-bold text-gray-900 dark:text-white">
              Help Center
            </Text>
            <Text className="text-gray-500 text-sm">
              Find answers or contact us
            </Text>
          </View>
        </View>

        {/* FAQ */}
        <View className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl p-4">
          {/* CATEGORY */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2 mb-4">
              {categories.map((c) => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => setCategory(c.name)}
                  className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${category === c.name
                      ? "bg-blue-100"
                      : "bg-gray-200"
                    }`}
                >
                  <c.icon size={14} />
                  <Text>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* FAQ LIST */}
          {filtered.map((faq, index) => (
            <View key={index} className=" border border-gray-300 dark:border-gray-700 rounded-lg mb-2">
              <TouchableOpacity
                onPress={() =>
                  setExpanded(expanded === index ? null : index)
                }
                className="flex-row justify-between p-3"
              >
                <Text className="flex-1 text-gray-800 dark:text-gray-100">
                  {faq.question}
                </Text>
                {expanded === index ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
              </TouchableOpacity>

              {expanded === index && (
                <View className="px-3 pb-3">
                  <Text className="text-gray-800 dark:text-gray-100 text-sm">
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* CONTACT FORM */}
        <View  className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl p-4 mt-4">

          {submitted ? (
            <View className="items-center py-6">
              <CheckCircle size={40} color="green" />
              <Text className="mt-3">Message Sent!</Text>
              <TouchableOpacity
                onPress={resetForm}
                className="mt-4 bg-gray-300 dark:bg-gray-100 px-4 py-2 rounded"
              >
                <Text>Send Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TextInput
                placeholder="Name *"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 dark:border-gray-700 
               bg-white dark:bg-[#1a1a1a] 
               text-black dark:text-white 
               p-3 rounded-lg mb-2 p-2"
                onChangeText={(t) => setForm({ ...form, name: t })}
              />

              <TextInput
                placeholder="Email *"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 dark:border-gray-700 
               bg-white dark:bg-[#1a1a1a]  
               text-black dark:text-white 
               p-3 rounded-lg mb-2 p-2"
                onChangeText={(t) => setForm({ ...form, email: t })}
              />

              <TextInput
                placeholder="Subject"
                placeholderTextColor="#9CA3AF"
                className="border border-gray-300 dark:border-gray-700 
               bg-white dark:bg-[#1a1a1a] 
               text-black dark:text-white 
               p-3 rounded-lg mb-2 p-2"
                onChangeText={(t) => setForm({ ...form, subject: t })}
              />

              <TextInput
                placeholder="Message *"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                className="border border-gray-300 dark:border-gray-700 
               bg-white dark:bg-[#1a1a1a] 
               text-black dark:text-white 
               p-3 rounded-lg mb-3 p-2"
                onChangeText={(t) => setForm({ ...form, message: t })}
              />

              <TouchableOpacity
                onPress={handleSubmit}
                className="bg-blue-600 py-3 rounded-lg flex-row justify-center items-center"
              >
                <Send color="white" size={16} />
                <Text className="text-white ml-2">
                  {loading ? "Sending..." : "Send Message"}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* URGENT HELP */}
        <View  className="bg-white dark:bg-[#1a1a1a] border border-gray-300 dark:border-gray-700 rounded-xl p-4 mt-5 mb-10">
          <View className="flex-row items-center gap-2 mb-2">
            <Shield size={18} color="blue" />
            <Text className="font-semibold  text-black dark:text-white ">Need urgent help?</Text>
          </View>
          <Text className="text-sm  text-black dark:text-white  mb-2">
            Contact us directly for critical issues:
          </Text>
          <Text className="text-blue-600">support@livetag.in</Text>
        </View>

      </ScrollView>
    </Layout>
  );
}