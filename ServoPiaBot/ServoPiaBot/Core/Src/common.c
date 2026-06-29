#include "common.h"
#include "stm32f4xx_hal.h"

// 毫秒延时（复用HAL库）
void delay_ms(uint32_t ms)
{
    HAL_Delay(ms);
}

// 微秒延时（基于系统时钟）
void delay_us(uint32_t us)
{
    uint32_t ticks = (HAL_RCC_GetHCLKFreq() / 1000000) * us;
    uint32_t start = SysTick->VAL;
    while((start - SysTick->VAL) < ticks);
}
