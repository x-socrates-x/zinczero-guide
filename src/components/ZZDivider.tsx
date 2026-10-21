import React from "react";
import { DimensionValue, Image, StyleSheet, View } from "react-native";

type Props = {
    width?: DimensionValue;
    height?: number;
    marginTop?: number;
    marginBottom?: number;
};

export default function ZZDivider({
    width = "92%",
    height = 26,
    marginTop = 10,
    marginBottom = 0,
}: Props) {
    return (
        <View style={[styles.container, { marginTop, marginBottom }]}>
            <Image
                source={require("../assets/images/divider.png")}
                style={{ width: 150, height }}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        justifyContent: "center",
    },
});
