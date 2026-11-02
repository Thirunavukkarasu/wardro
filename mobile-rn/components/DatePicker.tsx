import { View, Text, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import DatePicker from "react-native-date-picker";

export default function OmDatePicker() {
  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(!open)}
        className={`border border-gray-300 rounded p-2 bg-white`}
      >
        <Text className={`text-base`}>{date.toDateString()}</Text>
      </TouchableOpacity>

      <DatePicker
        modal
        open={open}
        date={date}
        onConfirm={(date: any) => {
          setOpen(false);
          setDate(date);
        }}
        onCancel={() => {
          setOpen(false);
        }}
      />
    </>
  );
}
