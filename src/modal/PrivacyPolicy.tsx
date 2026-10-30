
import React from "react";
import {
  View,
  Text,
  ScrollView,
  Linking,
  TouchableOpacity,
} from "react-native";

export default function PrivacyPolicyScreen() {
  const openEmail = async () => {
    try {
      await Linking.openURL("mailto:ping@livetag.in");
    } catch (error) {
      console.warn("Unable to open email app:", error);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-black"
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="w-full max-w-4xl self-center px-6 py-8">
        {/* Title */}
        <Text className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Privacy Policy
        </Text>

        <Text className="mb-8 text-xs text-gray-500 dark:text-gray-400">
          Effective Date: 01 Oct 2025
        </Text>

        {/* Introduction */}
        <View className="mb-6">
          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            Welcome to{" "}
            <Text className="font-bold">Livetag Technologies</Text>. We are
            committed to protecting your privacy and ensuring transparency in
            how your data is handled across our e-paper display systems,
            dashboards, and connected platforms.
          </Text>
        </View>

        {/* 1. Information We Collect */}
        <Section title="1. Information We Collect">
          <Bullet>Personal details (name, email, phone, company)</Bullet>
          <Bullet>Account and authentication data</Bullet>
          <Bullet>Device identifiers (Frame ID, IP address)</Bullet>
          <Bullet>Uploaded content (images, media, schedules)</Bullet>
          <Bullet>Usage analytics and logs</Bullet>
        </Section>

        {/* 2. How We Use Your Data */}
        <Section title="2. How We Use Your Data">
          <Bullet>Service delivery and device synchronization</Bullet>
          <Bullet>User authentication and access control</Bullet>
          <Bullet>Platform performance optimization</Bullet>
          <Bullet>Security and fraud prevention</Bullet>
          <Bullet>Customer support and communication</Bullet>
        </Section>

        {/* 3. GDPR Compliance */}
        <Section title="3. GDPR Compliance (EU Users)">
          <Text className="mb-3 text-base leading-6 text-gray-700 dark:text-gray-300">
            If you are located in the European Economic Area (EEA), we process
            your data under applicable lawful bases, which may include:
          </Text>

          <Bullet>Consent (Article 6(1)(a))</Bullet>
          <Bullet>Contractual necessity (Article 6(1)(b))</Bullet>
          <Bullet>Legal obligation (Article 6(1)(c))</Bullet>
          <Bullet>Legitimate interests (Article 6(1)(f))</Bullet>

          <Text className="mb-2 mt-4 text-base font-bold text-gray-900 dark:text-white">
            Your GDPR rights include:
          </Text>

          <Bullet>Right to access</Bullet>
          <Bullet>Right to rectification</Bullet>
          <Bullet>Right to erasure</Bullet>
          <Bullet>Right to data portability</Bullet>
          <Bullet>Right to restrict processing</Bullet>
        </Section>

        {/* 4. India DPDP Act */}
        <Section title="4. India DPDP Act, 2023 Compliance">
          <Text className="mb-3 text-base leading-6 text-gray-700 dark:text-gray-300">
            We act as a Data Fiduciary under the DPDP Act, 2023, where
            applicable.
          </Text>

          <Bullet>Data processed for specified purposes</Bullet>
          <Bullet>Consent obtained where required</Bullet>
          <Bullet>Users can request correction or deletion, subject to applicable law</Bullet>
          <Bullet>Security safeguards implemented</Bullet>

          <Text className="mt-3 text-base leading-6 text-gray-700 dark:text-gray-300">
            You may contact us to exercise your rights.
          </Text>
        </Section>

        {/* 5. Data Sharing */}
        <Section title="5. Data Sharing">
          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            We do not sell personal data. We may share it with trusted service
            providers or legal authorities when required.
          </Text>
        </Section>

        {/* 6. Data Retention */}
        <Section title="6. Data Retention">
          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            We retain data only as long as necessary for service delivery,
            compliance, and dispute resolution.
          </Text>
        </Section>

        {/* 7. Data Security */}
        <Section title="7. Data Security">
          <Bullet>Encryption of sensitive data</Bullet>
          <Bullet>Secure APIs and authentication</Bullet>
          <Bullet>Role-based access control (RBAC)</Bullet>
        </Section>

        {/* 8. Cookies */}
        <Section title="8. Cookies & Tracking">
          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            We use cookies to improve the user experience and analyze usage
            where applicable. You can manage available preferences in settings.
          </Text>
        </Section>

        {/* 9. Third-Party Services */}
        <Section title="9. Third-Party Services">
          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            External integrations may have their own privacy policies. Please
            review those policies when using third-party services.
          </Text>
        </Section>

        {/* 10. Policy Updates */}
        <Section title="10. Policy Updates">
          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            We may update this policy from time to time. We will communicate
            changes where required by applicable law.
          </Text>
        </Section>

        {/* 11. Contact Us */}
        <View className="mb-6">
          <Text className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            11. Contact Us
          </Text>

          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            Livetag Technologies
          </Text>

          <TouchableOpacity
            onPress={openEmail}
            accessibilityRole="link"
            accessibilityLabel="Email ping@livetag.in"
            className="self-start py-1"
            activeOpacity={0.7}
          >
            <Text className="text-base text-blue-600 dark:text-blue-400">
              ping@livetag.in
            </Text>
          </TouchableOpacity>

          <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
            Address: LIVETAG TECHNOLOGIES LLP{"\n"}
            INNOV8 SKCL TECH SQUARE GUINDY{"\n"}
            INDUSTRIAL ESTATE GUINDY{"\n"}
            CHENNAI 600032
          </Text>
        </View>

        {/* Footer */}
        <Text className="mb-4 mt-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Livetag Technologies
        </Text>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-6">
      <Text className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </Text>

      <View>{children}</View>
    </View>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="mb-1 flex-row items-start">
      <Text className="mr-2 text-base leading-6 text-gray-700 dark:text-gray-300">
        {"\u2022"}
      </Text>

      <View className="flex-1">
        <Text className="text-base leading-6 text-gray-700 dark:text-gray-300">
          {children}
        </Text>
      </View>
    </View>
  );
}
