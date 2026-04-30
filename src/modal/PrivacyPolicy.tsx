import React from "react";
import { View, Text, ScrollView, Linking } from "react-native";

export default function PrivacyPolicyScreen() {
    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-black">
            <View className="max-w-4xl mx-auto px-6 py-10">

                {/* Title */}
                <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Privacy Policy
                </Text>

                <Text className="text-xs text-gray-500 mb-8">
                    Effective Date: 01 Oct 2025
                </Text>

                {/* Intro */}
                {/* Intro */}
                <View className="mb-6">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        Welcome to <Text className="font-bold">Livetag Technologies</Text>. We are
                        committed to protecting your privacy and ensuring transparency in how your
                        data is handled across our e-paper display systems, dashboards, and
                        connected platforms.
                    </Text>
                </View>

                {/* 1 */}
                <Section title="1. Information We Collect">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300">• Personal details (name, email, phone, company)</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Account and authentication data</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Device identifiers (Frame ID, IP address)</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Uploaded content (images, media, schedules)</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Usage analytics and logs</Text>
                    </View>
                </Section>

                {/* 2 */}
                <Section title="2. How We Use Your Data">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300">• Service delivery and device synchronization</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• User authentication and access control</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Platform performance optimization</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Security and fraud prevention</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Customer support and communication</Text>
                    </View>
                </Section>

                {/* 3 */}
                <Section title="3. GDPR Compliance (EU Users)">
                    <Text className="text-gray-700 dark:text-gray-300 mb-2">
                        If you are located in the European Economic Area (EEA), we process your
                        data under lawful bases:
                    </Text>
                     <View className="mb-4"> 
                        <Text className="text-gray-700 dark:text-gray-300 mb-1">• Consent (Article 6(1)(a))</Text>
                        <Text className="text-gray-700 dark:text-gray-300 mb-1">• Contractual necessity (Article 6(1)(b))</Text>
                        <Text className="text-gray-700 dark:text-gray-300 mb-1">• Legal obligation (Article 6(1)(c))</Text>
                        <Text className="text-gray-700 dark:text-gray-300 mb-1">• Legitimate interests (Article 6(1)(f))</Text>
                    </View>{"\n"}

                    <Text className="text-gray-900 font-bold dark:text-gray-300 mt-3">
                        Your GDPR rights include:
                    </Text>{"\n"}

                    <View className="mt-2">
                        <Text className="text-gray-700 dark:text-gray-300">• Right to access</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Right to rectification</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Right to erasure</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Right to data portability</Text>
                        <Text className="text-gray-700 dark:text-gray-300 mb-2">• Right to restrict processing</Text>
                    </View>
                </Section>  
                {/* 4 */}
                <Section title="4. India DPDP Act, 2023 Compliance">
                    <Text className="text-gray-700 dark:text-gray-300 mb-2">
                        We act as a Data Fiduciary under the DPDP Act, 2023.
                    </Text>

                    <View>
                        <Text className="text-gray-700 dark:text-gray-300">• Data processed only for specified purposes</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Consent obtained where required</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Users can request correction or deletion</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Security safeguards implemented</Text>
                    </View>{"\n"}

                    <Text className="text-gray-700 dark:text-gray-300 mt-2">
                        You may contact us to exercise your rights.
                    </Text>
                </Section>

                {/* 5 */}
                <Section title="5. Data Sharing">
                    <Text className="text-gray-700 dark:text-gray-300">
                        We do not sell personal data. We may share it with trusted providers or
                        legal authorities when required.
                    </Text>
                </Section>

                {/* 6 */}
                <Section title="6. Data Retention">
                    <Text className="text-gray-700 dark:text-gray-300">
                        We retain data only as long as necessary for service, compliance, and
                        dispute resolution.
                    </Text>
                </Section>

                {/* 7 */}
                <Section title="7. Data Security">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300">• Encryption of sensitive data</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Secure APIs and authentication</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• Role-based access control (RBAC)</Text>
                    </View>
                </Section>

                {/* 8 */}
                <Section title="8. Cookies & Tracking">
                    <Text className="text-gray-700 dark:text-gray-300">
                        We use cookies to improve experience and analyze usage. You can manage
                        preferences in settings.
                    </Text>
                </Section>

                {/* 9 */}
                <Section title="9. Third-Party Services">
                    <Text className="text-gray-700 dark:text-gray-300">
                        External integrations may have their own privacy policies.
                    </Text>
                </Section>

                {/* 10 */}
                <Section title="10. Policy Updates">
                    <Text className="text-gray-700 dark:text-gray-300">
                        We may update this policy. Continued use means acceptance of changes.
                    </Text>
                </Section>

                <Section title="11. Contact Us">
                    Livetag Technologies{"\n"}

                    <Text
                        className="text-blue-500"
                        onPress={() => Linking.openURL("mailto:ping@livetag.in")}
                    >
                        ping@livetag.in
                    </Text>{"\n"}

                    Address: LIVETAG TECHNOLOGIES LLP {"\n"}
                    INNOV8 SKCL TECH SQUARE GUINDY {"\n"}
                    INDUSTRIAL ESTATE GUINDY {"\n"}
                    CHENNAI 600032

                </Section>

                {/* Footer */}
                <Text className="text-xs text-gray-400 mt-10 text-center">
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
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {title}
            </Text>
            <Text className="text-gray-700 dark:text-gray-300 leading-5">
                {children}
            </Text>
        </View>
    );
}