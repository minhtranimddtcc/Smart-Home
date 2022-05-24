import React, { useEffect, useState, useReducer, useContext } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import LinearGradient from 'react-native-linear-gradient';
// import Tooltip from 'react-native-walkthrough-tooltip';
import Toast from 'react-native-toast-message';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { NumericCard, ControllerCard } from '../components/Card';
import { MQTTContext } from '../scripts/MQTTProvider';
import { DatabaseContext } from '../scripts/DatabaseProvider';
import { AuthContext } from '../scripts/AuthProvider';

import { colors } from '../scripts/colors';

export default function Dashboard({ navigation }) {
    const {
        doorLock,
        fraudDetector,
        fireDetector,
        temperature,
        humidity,
        gas,
        fetchLatestData,
        connect,
        isConnected,
        disconnect,
        publishFireDetector
    } = useContext(MQTTContext);
    const dbCtx = useContext(DatabaseContext);
    const authCtx = useContext(AuthContext);
    const screen = useWindowDimensions();
    const [sectorColor, setSectorColor] = useState('rgba(0, 0, 0, 1)');
    const [checkData, setCheckData] = useState(false);
    const [tryFlag, setTryFlag] = useState(false);
    const [dotStroke, setDotStroke] = useState('white');

    const devices = [
        {
            id: 0,
            title: 'Khóa cửa',
            icon: ['door-open', 'door-closed'],
        },
        {
            id: 1,
            title: 'Chống trộm',
            icon: 'user-shield',
        },
    ]

    useEffect(() => {
        var set = new Set(gas.data);
        if (set.size === 1) {
            setCheckData(true);
        } else {
            setCheckData(false);
        }
        if (gas.data[gas.data.length - 1] >= 40) {
            setSectorColor('rgba(255, 0, 0, 1)');
            setDotStroke('red');
        } else {
            setSectorColor(colors.BKDarkBlue);//'rgba(255, 255, 255, 1)');
            setDotStroke(colors.BKDarkBlue);
        }
    }, [gas]);

    useEffect(() => {
        dbCtx.fetchMqttToken(
            authCtx.user.token.uid,
            connect
        );
        return () => {
            disconnect();
        }
    }, []);

    useEffect(() => {
        try {
            if (isConnected) {
                fetchLatestData();
                return;
            }
            else {
                throw new Error("Not connected");
            }
        } catch (error) {
            setTimeout(() => {
                setTryFlag((prev) => !prev)
            }, 20000);
        }
    }, [tryFlag]);
    // const [openTool, setOpenTool] = useState(false);
    const colorController = [colors.neonRed, colors.neonGreenDark];
    const handlePress = () => {
        if (fireDetector.isOn) {
            Alert.alert(
                "Tắt thiết bị báo cháy",
                "Bạn có thật sự muốn tắt thiết bị báo cháy không ?",
                [
                    {
                        text: "Hủy",
                        style: "cancel"
                    },
                    { text: "Đồng ý", onPress: turnOffFire }
                ]
            );
        } else {
            Toast.show({
                type: 'success',
                text1: 'Thông tin',
                text2: 'Mở thiết bị báo cháy thành công!',
                position: 'top',
            })
        }
    }
    const turnOffFire = () => {
        Toast.show({
            type: 'success',
            text1: 'Thông tin',
            text2: 'Tắt thiết bị báo cháy thành công!',
            position: 'top',
        })
    }
    return (
        <SafeAreaView style={styles.container}>

            <LinearGradient
                colors={[colors.background, colors.backgroundMedium]}
                style={styles.container}
                useAngle={true}
                angle={180}
                angleCenter={{ x: 0, y: 0.7 }}
            >
                <View style={{ marginVertical: 5, marginHorizontal: 10 }}>
                    <Text style={[styles.headerText, { opacity: 0.5 }]}>Xin chào!</Text>
                    <Text style={[styles.headerText, { fontWeight: '700', fontSize: 23 }]}>
                        Sơn Đại Gia
                    </Text>
                </View>
                <View style={styles.visualNumericData}>
                    <FlatList
                        data={[temperature, humidity]}
                        horizontal={true}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => <NumericCard {...item} />}
                    />
                </View>
                <View style={styles.graph}>
                    <View style={{ flexDirection: 'row' }}>
                        <Text
                            style={[
                                styles.headerText,
                                { marginLeft: 20, flex: 3, fontSize: 28, fontWeight: '700', color: colors.BKLightBlue, alignSelf: 'center', width: screen.width * 0.9, textAlign: 'left', paddingBottom: 10, },
                            ]}>
                            Nồng độ khí gas
                        </Text>
                        <TouchableOpacity
                            style={styles.fireBtn}
                            onPress={handlePress}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 5 }}>
                                <MaterialCommunityIcons
                                    style={{ alignSelf: 'center', paddingRight: 5 }}
                                    name={'bell-outline'}
                                    size={30}
                                    color={fireDetector.isOn ? colors.neonGreenDark : colors.neonRed}
                                />
                                <Text style={{ fontSize: 19, fontWeight: '900', fontFamily: 'Nunito-Medium', color: fireDetector.isOn ? colors.neonGreenDark : colors.neonRed }}>Báo cháy</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <LineChart
                        // onDataPointClick={({value, getColor}) => {
                        //     setOpenTool(true);
                        // }}
                        data={{
                            labels: gas.time,
                            datasets: [
                                {
                                    data: gas.data,
                                },
                            ],
                        }}
                        width={screen.width * 0.9} // from react-native
                        height={screen.height * 0.3}
                        // yAxisLabel="$"
                        yAxisSuffix="%"
                        yAxisInterval={6} // optional, defaults to 1
                        chartConfig={{
                            // backgroundColor: "#e26a00",
                            backgroundGradientFrom: '#AAD2FF', //'#389FFF',
                            backgroundGradientTo: '#AAD2FF', //'#389FFF',
                            decimalPlaces: 0, // optional, defaults to 2dp
                            color: () => sectorColor,
                            labelColor: (opacity = 1) => `rgba(0, 60, 215, ${opacity})`,
                            // style: {
                            //     borderRadius: 16,

                            // },
                            propsForDots: {
                                r: '6',
                                strokeWidth: '2',
                                stroke: dotStroke,
                            },
                            propsForLabels: {
                                fontSize: 22,
                                fontFamily: 'Digital-7',

                            },
                            propsForVerticalLabels: {
                                fontSize: 18,
                                // fontWeight: '900'
                            },
                        }}
                        getDotColor={dataPoint => {
                            if (dataPoint >= 40) {
                                return 'red';

                            } else {
                                return colors.BKDarkBlue;//'white';
                            }
                        }}
                        // renderDotContent={(x, y, index, indexData) => {
                        //     return(
                        //         <Tooltip
                        //             content={
                        //                 <View><Text>{indexData}</Text></View>
                        //             }
                        //             placement='center'
                        //             isVisible={openTool}
                        //             onClose={()=>setOpenTool(false)}
                        //         >
                        //         </Tooltip>
                        //     )
                        // }}
                        segments={3}
                        fromZero={checkData}
                        style={{
                            // marginVertical: 8,
                            borderRadius: 12,
                            alignSelf: 'center',
                            marginTop: -25,
                            paddingTop: 25,
                        }}
                    />
                </View>
                <View style={styles.controller}>
                    <FlatList
                        data={devices}
                        renderItem={({ item }) => (
                            //'#6dacc9', '#a6e3ff'#3eadcf#abe9cd #83eaf1#63a4ff #f6ebe6#aee1f9
                            <ControllerCard //#aacaef #fde7f9 #cfd6e6#e7eff9 #b8d3fe#aecad6 #f6ebe6#aee1f9
                                {...item} //#98fcbd#9cdaf8 #66b5f6#bfe299 #b8d3fe#aecad6
                                gradColor={[colors.backgroundMedium, '#e6e6e6']}
                                onPress={() => navigation.navigate(item.title)}
                                // style={{ color: 'black' }}
                                // icon={}

                                icon={item.id ? item.icon : item.icon[doorLock.isOn]}
                                style={{ color: colorController[item.id ? fraudDetector.isOn : doorLock.isOn], fontWeight: '900' }}
                            />
                        )}
                        keyExtractor={item => item.id}
                        key={2}
                        numColumns={2}
                    />
                </View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'stretch',
        // backgroundColor: colors.background,
    },
    visualNumericData: {
        flex: 1.7,
        // backgroundColor: 'red',
    },
    graph: {
        flex: 3.5,
        // backgroundColor: 'black',
    },
    controller: {
        flex: 2.5,
        // backgroundColor: 'black',
        // padding:20,
        // marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        fontFamily: 'Nunito-Medium',
        fontSize: 18,
        marginLeft: 10,
    },
    fireBtn: {
        flex: 2,
        marginRight: 20,
        justifyContent: 'center',
        alignItems: 'flex-end'
    }
});
