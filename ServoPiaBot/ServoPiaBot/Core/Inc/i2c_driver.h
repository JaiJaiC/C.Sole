#ifndef _I2C_DRIVER_H_
#define _I2C_DRIVER_H_

#include "stm32f4xx_hal.h" // 核心修改：换成 F4 的 HAL 库
#include "common.h"

// ********************** I2C宏定义 (适配 PD14 和 PD13) *********************
#define I2C_DRIVER_SCL   GPIO_PIN_14  // 你的 SCL 接 PD14
#define I2C_DRIVER_SDA   GPIO_PIN_13  // 你的 SDA 接 PD13
#define GPIO_I2C_DRIVER  GPIOD        // 你的引脚在 D 组

// ********************** 频率与延时设置 ***********************************
#define I2C_FREQUENCY        (400000)

// ********************** I2C函数申明 (把 u8 换成 uint8_t 更标准) **********
void I2C_DRIVER_Init_GPIO(void);
void I2C_DRIVER_Send_Byte(uint8_t txd);
uint8_t I2C_DRIVER_Read_Byte(uint8_t ack);
void I2C_DRIVER_Read_Bytes(uint8_t SlaveAddress, uint8_t REG_Address, uint8_t* rec_buffer, uint8_t len);
void I2C_DRIVER_Write_Bytes(uint8_t SlaveAddress, uint8_t REG_Address, uint8_t* REG_data, uint8_t len);
void I2C_DRIVER_POC(uint8_t SlaveAddress, uint8_t REG_Address, uint8_t* REG_data, uint8_t len);   

#endif /* _I2C_DRIVER_H_ */
