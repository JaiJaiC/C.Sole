#include <stdint.h>
#include <stdio.h>
#include <math.h>
#include "common.h"
#include "i2c_driver.h"
#include "pca9685reg.h"
#include "pca9685_control.h"

static void PCA9685_write(u8 address, u8 reg_addr, u8 data);
static void PCA9685_write_reg16(u8 address, u8 reg_addr, u16 data);
static void PCA9685_read_reg16(u8 address, u8 reg_addr, u16 *data);
static void PCA9685_read(u8 address, u8 reg_addr, u8* rec_buffer, u8 len);

void pca9685_init(void)
{
    I2C_DRIVER_Init_GPIO();
    pca9685_set_freq(50);
}

void pca9685_set_freq(float freq)
{
    u8 prescale, oldmode, new_mode;
    float prescaleval;
    freq *= 0.915; // 频率校准系数
    prescaleval = 25000000;
    prescaleval /= 4096;
    prescaleval /= freq;
    prescaleval -= 1;
    prescale = floor(prescaleval + 0.5);

    /* ---------- 初始化第一块 PCA9685 (0号-15号) ---------- */
    PCA9685_read(PCA9685_adrr, PCA9685_MODE1, &oldmode, 1);
    oldmode &= 0x7f;
    PCA9685_write(PCA9685_adrr, PCA9685_MODE1, oldmode | 0x10); // sleep
    PCA9685_write(PCA9685_adrr, PCA9685_MODE1, ((oldmode & 0xbf) | 0x20)); // set AI
    new_mode = ((oldmode & 0xbf) | 0x20);
    PCA9685_write(PCA9685_adrr, PCA9685_PRESCALE, prescale);
    PCA9685_write(PCA9685_adrr, PCA9685_MODE1, new_mode & 0xef); // out sleep
    delay_ms(5);

    /* ---------- 初始化第二块 PCA9685 (16号-31号) ---------- */
    PCA9685_read(PCA9685_adrr2, PCA9685_MODE1, &oldmode, 1);
    oldmode &= 0x7f;
    PCA9685_write(PCA9685_adrr2, PCA9685_MODE1, oldmode | 0x10); 
    PCA9685_write(PCA9685_adrr2, PCA9685_MODE1, ((oldmode & 0xbf) | 0x20)); 
    new_mode = ((oldmode & 0xbf) | 0x20);
    PCA9685_write(PCA9685_adrr2, PCA9685_PRESCALE, prescale);
    PCA9685_write(PCA9685_adrr2, PCA9685_MODE1, new_mode & 0xef); 
    delay_ms(5);

    /* ---------- 初始化第三块 PCA9685 (32号-47号) ---------- */
    PCA9685_read(PCA9685_adrr3, PCA9685_MODE1, &oldmode, 1);
    oldmode &= 0x7f;
    PCA9685_write(PCA9685_adrr3, PCA9685_MODE1, oldmode | 0x10); 
    PCA9685_write(PCA9685_adrr3, PCA9685_MODE1, ((oldmode & 0xbf) | 0x20)); 
    new_mode = ((oldmode & 0xbf) | 0x20);
    PCA9685_write(PCA9685_adrr3, PCA9685_PRESCALE, prescale);
    PCA9685_write(PCA9685_adrr3, PCA9685_MODE1, new_mode & 0xef); 
    delay_ms(5);

    /* ---------- 初始化第四块 PCA9685 (48号-63号) ---------- */
    PCA9685_read(PCA9685_adrr4, PCA9685_MODE1, &oldmode, 1);
    oldmode &= 0x7f;
    PCA9685_write(PCA9685_adrr4, PCA9685_MODE1, oldmode | 0x10); 
    PCA9685_write(PCA9685_adrr4, PCA9685_MODE1, ((oldmode & 0xbf) | 0x20)); 
    new_mode = ((oldmode & 0xbf) | 0x20);
    PCA9685_write(PCA9685_adrr4, PCA9685_PRESCALE, prescale);
    PCA9685_write(PCA9685_adrr4, PCA9685_MODE1, new_mode & 0xef); 
    delay_ms(5);
}

void pca9685_set_mk(int num, int mk)
{
    u16 ON, OFF;

    ON = 0;
    OFF = (u16)((((double)mk) / 20000 * 4096) * 1.0067114);

    if(num < 16)
    {
        PCA9685_write_reg16(PCA9685_adrr, LED0_ON_L + 4 * num, ON);
        PCA9685_write_reg16(PCA9685_adrr, LED0_OFF_L + 4 * num, OFF);
    }
    else if (num >= 16 && num < 32)
    {
        PCA9685_write_reg16(PCA9685_adrr2, LED0_ON_L + 4 * (num - 16), ON);
        PCA9685_write_reg16(PCA9685_adrr2, LED0_OFF_L + 4 * (num - 16), OFF);
    }
    else if (num >= 32 && num < 48)
    {
        PCA9685_write_reg16(PCA9685_adrr3, LED0_ON_L + 4 * (num - 32), ON);
        PCA9685_write_reg16(PCA9685_adrr3, LED0_OFF_L + 4 * (num - 32), OFF);
    }
    else if (num >= 48 && num < 64)
    {
        PCA9685_write_reg16(PCA9685_adrr4, LED0_ON_L + 4 * (num - 48), ON);
        PCA9685_write_reg16(PCA9685_adrr4, LED0_OFF_L + 4 * (num - 48), OFF);
    }
}

/* ---- 静态辅助函数实现，保持不变 ---- */
static void PCA9685_write(u8 address, u8 reg_addr, u8 data)
{
    I2C_DRIVER_Write_Bytes(address, reg_addr, &data, 1);
}

static void PCA9685_write_reg16(u8 address, u8 reg_addr, u16 data)
{
    I2C_DRIVER_Write_Bytes(address, reg_addr, (u8*)(&data), 2);
}

static void PCA9685_read_reg16(u8 address, u8 reg_addr, u16 *data)
{
    I2C_DRIVER_Read_Bytes(address, reg_addr, (u8*)data, 2); 
}

static void PCA9685_read(u8 address, u8 reg_addr, u8* rec_buffer, u8 len)
{
    I2C_DRIVER_Read_Bytes(address, reg_addr, rec_buffer, len);
}