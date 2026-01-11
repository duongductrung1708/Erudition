import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        background: {
            default: "white", // Màu nền chung cho toàn bộ ứng dụng
        },
    },
    // typography: {
    //     // Thu nhỏ toàn bộ font-size của ứng dụng
    //     htmlFontSize: 16, // Cài đặt đơn vị font-size mặc định của html
    //     h1: {
    //         fontSize: '2.25rem', // giảm kích thước của h1
    //     },
    //     h2: {
    //         fontSize: '2rem', // giảm kích thước của h2
    //     },
    //     h3: {
    //         fontSize: '1.8rem', // giảm kích thước của h3
    //     },
    //     h4: {
    //         fontSize: '1.5rem', // giảm kích thước của h4
    //     },
    //     h5: {
    //         fontSize: '1.25rem', // giảm kích thước của h5
    //     },
    //     h6: {
    //         fontSize: '1rem', // giảm kích thước của h6
    //     },
    //     body1: {
    //         fontSize: '0.8rem', // giảm kích thước của body1
    //     },
    //     body2: {
    //         fontSize: '0.7rem', // giảm kích thước của body2
    //     },
    //     button: {
    //         fontSize: '0.8rem', // giảm kích thước của button
    //     },
    // },

    components: {
        MuiBox: {
            styleOverrides: {
                root: {
                    transform: "scale(0.9)", // Thu nhỏ tất cả Box xuống 75%
                    transformOrigin: "top left", // Đảm bảo vị trí không bị lệch
                },
            },
        },
    },
});

export default theme;
