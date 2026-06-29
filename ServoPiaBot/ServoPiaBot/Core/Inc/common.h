#ifndef __COMMON_H
#define __COMMON_H

#include <stdint.h>
#include "stm32f4xx_hal.h"

// 类型重定义
typedef uint8_t u8;
typedef uint16_t u16;
typedef uint32_t u32;

// I2C引脚定义（电路图中SCL/SDA在PD14/PD13）
#define GPIO_I2C_DRIVER GPIOD
#define I2C_DRIVER_SCL  GPIO_PIN_14
#define I2C_DRIVER_SDA  GPIO_PIN_13

// I2C延时（单位：us，确保时序稳定）
#define I2C_CYCLE_DELAY_US 5

// PCA9685地址（对应电路图）
#define PCA9685_adrr   0x80  // 0x40 << 1
#define PCA9685_adrr2  0x82  // 0x41 << 1
#define PCA9685_adrr3  0x84  // 0x42 << 1
#define PCA9685_adrr4  0x86  // 0x43 << 1

// PCA9685寄存器定义（补全pca9685reg.h）
#define PCA9685_MODE1     0x00
#define PCA9685_MODE2     0x01
#define PCA9685_PRESCALE  0xFE
#define LED0_ON_L         0x06
#define LED0_ON_H         0x07
#define LED0_OFF_L        0x08
#define LED0_OFF_H        0x09

// 延时函数实现（HAL库版）
void delay_ms(uint32_t ms);
void delay_us(uint32_t us);

#endif
