import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    Modal,
    TextInput,
    TouchableOpacity,
    Switch,
    ScrollView,
    ActivityIndicator,
} from "react-native";
import {
    X, Globe, Moon, Power, ChevronDown,
    ChevronUp,
} from "lucide-react-native";
import api from "../lib/api";
import { Frame } from "../types/Frame";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Clock } from "lucide-react-native";

type Props = {
    visible: boolean;
    onClose: () => void;
    device: Frame | null;
    onSave?: (device: Frame) => void;
};
type Timezone = {
    value: string;
    label: string;
};

export default function DeviceSettingsModal({
    visible,
    onClose,
    device,
    onSave,
}: Props) {
    const [name, setName] = useState("");
    const [timezone, setTimezone] = useState("");
    const [sleepStart, setSleepStart] = useState("");
    const [sleepEnd, setSleepEnd] = useState("");
    const [isEnabled, setIsEnabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [timezones, setTimezones] = useState<Timezone[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showSleepStartPicker, setShowSleepStartPicker] = useState(false);
    const [showSleepEndPicker, setShowSleepEndPicker] = useState(false);
    useEffect(() => {
        if (!device) return;

        setName(device.name || "");
        setTimezone(device.timezone || "");
        setSleepStart(device.sleepConfig?.sleepStart || "");
        setSleepEnd(device.sleepConfig?.sleepEnd || "");
        setIsEnabled(device.isEnabled ?? true);
    }, [device]);

    useEffect(() => {
        if (!visible) return;

        const loadTimezones = async () => {
            try {
                const res = await api.get("/timezone"); // ✅ your axios

                setTimezones(res.data);

                if (!device?.timezone && res.data?.length) {
                    setTimezone(res.data[0].value);
                }
            } catch (err) {
                console.log("Timezone error:", err); // ✅ mobile friendly
            }
        };

        loadTimezones();
    }, [visible]);

    const onSleepStartChange = (event: any, selectedDate?: Date) => {
        setShowSleepStartPicker(false);

        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, "0");
            const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
            setSleepStart(`${hours}:${minutes}`);
        }
    };

    const onSleepEndChange = (event: any, selectedDate?: Date) => {
        setShowSleepEndPicker(false);

        if (selectedDate) {
            const hours = selectedDate.getHours().toString().padStart(2, "0");
            const minutes = selectedDate.getMinutes().toString().padStart(2, "0");
            setSleepEnd(`${hours}:${minutes}`);
        }
    };

    const handleSave = async () => {
        if (!device) return;

        try {
            setLoading(true);

            await api.patch(`/frames/edit/${device.id}`, {
                name,
                timezone,
                isEnabled,
                sleepStart: sleepStart || null,
                sleepEnd: sleepEnd || null,
            });

            const updatedDevice: Frame = {
                ...device,
                name,
                timezone,
                isEnabled,
                sleepConfig: { sleepStart, sleepEnd },
            };

            onSave?.(updatedDevice);
            onClose();
        } catch (err) {
            console.log("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!visible || !device) return null;

    return (
        <Modal transparent animationType="fade">
            <View className="flex-1 bg-black/60 justify-center px-4">

                <View className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5">

                    {/* HEADER */}
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-lg font-bold text-black dark:text-white">
                            Device Settings
                        </Text>
                        <TouchableOpacity onPress={onClose}>
                            <X size={20} color="gray" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>

                        {/* DEVICE NAME */}
                        <View className="mb-5">
                            <Text className="text-gray-500 mb-2">Device Name</Text>
                            <TextInput
                                value={name}
                                onChangeText={setName}
                                className="border border-gray-300 rounded-xl px-4 py-3 text-black dark:text-white"
                            />
                        </View>

                        {/* ENABLE SWITCH CARD */}
                        <View className="flex-row justify-between items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-5">
                            <View className="flex-row items-center gap-3">
                                <Power size={18} color="gray" />
                                <Text className="text-black dark:text-white">
                                    Device Enabled
                                </Text>
                            </View>
                            <Switch value={isEnabled} onValueChange={setIsEnabled} />
                        </View>

                        {/* TIMEZONE */}
                        <View className="mb-5">

                            {/* LABEL */}
                            <Text className="text-gray-500 mb-2">Timezone</Text>

                            {/* SELECT BOX */}
                            <TouchableOpacity
                                onPress={() => setShowDropdown(!showDropdown)}
                                className="border border-gray-300 rounded-xl px-4 py-3 flex-row justify-between items-center"
                            >
                                <Text className="text-black dark:text-white">
                                    {timezone || "Select timezone"}
                                </Text>
                                {showDropdown ? (
                                    <ChevronUp size={18} color="gray" />
                                ) : (
                                    <ChevronDown size={18} color="gray" />
                                )}
                            </TouchableOpacity>

                            {/* DROPDOWN */}
                            {showDropdown && (
                                <View className="border border-gray-300 rounded-xl mt-2 bg-white dark:bg-[#1a1a1a] max-h-48">

                                    <ScrollView nestedScrollEnabled>
                                        {timezones.map((tz) => (
                                            <TouchableOpacity
                                                key={tz.value}
                                                onPress={() => {
                                                    setTimezone(tz.value); // ✅ store value
                                                    setShowDropdown(false);
                                                }}
                                                className={`px-4 py-3 ${timezone === tz.value ? "bg-blue-600" : ""
                                                    }`}
                                            >
                                                <Text
                                                    className={`${timezone === tz.value
                                                        ? "text-white"
                                                        : "text-black dark:text-white"
                                                        }`}
                                                >
                                                    {tz.label} {/* ✅ show label */}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                </View>
                            )}
                        </View>

                        {/* SLEEP */}
                        {/* SLEEP */}
                        <View className="mb-5">
                            <View className="flex-row items-center gap-2 mb-2">
                                <Moon size={16} color="gray" />
                                <Text className="text-gray-500">Sleep Schedule</Text>
                            </View>

                            <View className="flex-row gap-3">

                                {/* START */}
                                {/* START */}
                                <TouchableOpacity
                                    onPress={() => setShowSleepStartPicker(true)}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
                                >
                                    <Text className="text-black dark:text-white">
                                        {sleepStart || "Start"}
                                    </Text>

                                    <Clock size={16} color="gray" />
                                </TouchableOpacity>

                                {/* END */}
                                <TouchableOpacity
                                    onPress={() => setShowSleepEndPicker(true)}
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-3 flex-row items-center justify-between"
                                >
                                    <Text className="text-black dark:text-white">
                                        {sleepEnd || "End"}
                                    </Text>

                                    <Clock size={16} color="gray" />
                                </TouchableOpacity>

                            </View>
                        </View>

                    </ScrollView>

                    {/* BUTTONS */}
                    <View className="flex-row gap-3 mt-4">
                        <TouchableOpacity
                            onPress={onClose}
                            className="flex-1 border border-gray-300 py-3 rounded-xl"
                        >
                            <Text className="text-center text-black dark:text-white">
                                Cancel
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleSave}
                            className="flex-1 bg-blue-600 py-3 rounded-xl"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-center text-white font-bold">
                                    Save Settings
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                </View>
            </View>
            {showSleepStartPicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={onSleepStartChange}
                />
            )}

            {showSleepEndPicker && (
                <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour={true}
                    display="spinner"
                    onChange={onSleepEndChange}
                />
            )}
        </Modal>
    );
}