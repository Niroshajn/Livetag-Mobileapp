import React from "react";
import { View, Text, ScrollView, Linking } from "react-native";

export default function TermsOfServiceScreen() {
    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-black">
            <View className="max-w-4xl mx-auto px-6 py-10">

                {/* Title */}
                <Text className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Terms of Service
                </Text>

                <Text className="text-xs text-gray-500 mb-8">
                    Effective Date: 01 Oct 2025
                </Text>

                {/* Intro */}
                <Text className="text-gray-700 dark:text-gray-300 mb-6 leading-5">
                    Welcome to <Text className="font-bold">Livetag Technologies</Text>.
                    Service ("Terms") govern your access to and use of our platform,
                    including our e-paper display systems, dashboards, APIs, and
                    connected devices.
                </Text>

                <Text className="text-gray-700 dark:text-gray-300 mb-8">
                    By using our services, you agree to these Terms. If you do not
                    agree, please do not use our platform.
                </Text>

                <Section title="1. Eligibility">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        You must be at least 18 years old and capable of entering into a legally binding agreement to use our services.
                        {"\n\n"}
                        By creating an account, you represent and warrant that you meet these requirements.
                    </Text>
                </Section>

                {/* Accounts */}
                <Section title="2. Accounts & Access">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300">• You are responsible for maintaining account security</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• You must provide accurate and complete information</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• You are responsible for all activities under your account</Text>
                    </View>
                </Section>

                {/* Devices */}
                <Section title="3. Device Ownership & Usage">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        Each device (e.g., digital frame) must be claimed by a user account.
                        {"\n\n"}
                        Devices can support multiple users with role-based permissions.
                        {"\n\n"}
                        You are responsible for managing access and ownership sharing.
                    </Text>
                </Section>

                {/* Content */}
                <Section title="4. Content & Usage Rights">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        You retain ownership of content you upload.
                        {"\n\n"}
                        You grant Livetag a limited license to display and process content.
                        {"\n\n"}
                        You must not upload unlawful, harmful, or infringing content.
                    </Text>
                </Section>

                {/* Acceptable Use */}
                <Section title="5. Acceptable Use">
                    <View>
                        <Text className="text-gray-700 dark:text-gray-300">• No reverse engineering or unauthorized access</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• No interference with system performance</Text>
                        <Text className="text-gray-700 dark:text-gray-300">• No illegal or abusive activities</Text>
                    </View>
                </Section>

                {/* GDPR */}
                <Section title="6. Privacy & Data Protection">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        Your use of our services is governed by our Privacy Policy.
                        We process personal data in compliance with GDPR (EU) and India DPDP Act 2023.
                    </Text>
                </Section>

                {/* Availability */}
                <Section title="7. Service Availability">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        We strive for high availability but do not guarantee uninterrupted service.
                        Maintenance, updates, or external factors may cause downtime.
                    </Text>
                </Section>

                {/* Payments */}
                <Section title="8. Payments & Subscriptions">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        Certain features may require payment. Fees and refund policies will be clearly communicated where applicable.
                    </Text>
                </Section>

                {/* Termination */}
                <Section title="9. Termination">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        You may stop using our services at any time.
                        {"\n\n"}
                        We may suspend or terminate accounts for violations.
                        {"\n\n"}
                        Data may be deleted upon termination according to policy.
                    </Text>
                </Section>

                {/* Liability */}
                <Section title="10. Limitation of Liability">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        Livetag Technologies is not liable for indirect or consequential damages arising from use of services.
                    </Text>
                </Section>

                {/* Indemnity */}
                <Section title="11. Indemnification">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        You agree to indemnify Livetag Technologies from claims or damages arising from misuse of services.
                    </Text>
                </Section>

                {/* Changes */}
                <Section title="12. Changes to Terms">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        We may update these Terms. Continued use means acceptance of changes.
                    </Text>
                </Section>

                {/* Governing Law */}
                <Section title="13. Governing Law">
                    <Text className="text-gray-700 dark:text-gray-300 leading-5">
                        These Terms are governed by the laws of India. Disputes will be handled in courts of [Insert City].
                    </Text>
                </Section>

                <Section title="14. Contact Us">
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

                <Text className="text-xs text-gray-400 mt-10 text-center">
                    © {new Date().getFullYear()} Livetag Technologies. All rights
                    reserved.
                </Text>
            </View>
        </ScrollView>
    );
}

/* SECTION COMPONENT */
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