#include "stm32f4xx_hal.h"
#include "common.h"
#include "i2c_driver.h"

// ------------------ 核心引脚操作宏定义 (适配 HAL 库) ------------------
#define I2C_DRIVER_SCL_H HAL_GPIO_WritePin(GPIO_I2C_DRIVER, I2C_DRIVER_SCL, GPIO_PIN_SET)
#define I2C_DRIVER_SCL_L HAL_GPIO_WritePin(GPIO_I2C_DRIVER, I2C_DRIVER_SCL, GPIO_PIN_RESET)
#define I2C_DRIVER_SDA_H HAL_GPIO_WritePin(GPIO_I2C_DRIVER, I2C_DRIVER_SDA, GPIO_PIN_SET)
#define I2C_DRIVER_SDA_L HAL_GPIO_WritePin(GPIO_I2C_DRIVER, I2C_DRIVER_SDA, GPIO_PIN_RESET)
#define READ_SDA         HAL_GPIO_ReadPin(GPIO_I2C_DRIVER, I2C_DRIVER_SDA)

static void I2C_DRIVER_SDA_OUT(void);
static void I2C_DRIVER_SDA_IN(void);
static void I2C_DRIVER_Start(void);
static void I2C_DRIVER_Stop(void);
static void I2C_DRIVER_Ack(void);
static void I2C_DRIVER_NAck(void);
static u8   I2C_DRIVER_Wait_Ack(void);

//*****************I2C初始化函数*****************************************
void I2C_DRIVER_Init_GPIO(void)
{
    GPIO_InitTypeDef GPIO_InitStructure = {0}; 
    GPIO_InitStructure.Pin = I2C_DRIVER_SCL | I2C_DRIVER_SDA;
    // 【修改这里】从 PP 改为 OD (开漏输出)
    GPIO_InitStructure.Mode = GPIO_MODE_OUTPUT_OD; 
    GPIO_InitStructure.Pull = GPIO_PULLUP;
    GPIO_InitStructure.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    HAL_GPIO_Init(GPIO_I2C_DRIVER, &GPIO_InitStructure);

    I2C_DRIVER_SCL_H;
    I2C_DRIVER_SDA_H;
}

//*****************I2C发送一个字节****************************
void I2C_DRIVER_Send_Byte(u8 txd)
{
    u8 i = 0;
    I2C_DRIVER_SDA_OUT();                                      
    I2C_DRIVER_SCL_L;                                          
    for(i = 0; i < 8; i++)
    {
        if((txd & 0x80) > 0) I2C_DRIVER_SDA_H;
        else I2C_DRIVER_SDA_L;
        txd <<= 1;                                                   
        delay_us(I2C_CYCLE_DELAY_US);
        I2C_DRIVER_SCL_H;                                            
        delay_us(I2C_CYCLE_DELAY_US);                                
        I2C_DRIVER_SCL_L;                                            
    }   
}

//*****************I2C读取一个字节****************************
u8 I2C_DRIVER_Read_Byte(u8 ack)
{
    u8 i=0, receive=0;
    I2C_DRIVER_SDA_IN();
    for(i = 0; i < 8; i++)
    {
        I2C_DRIVER_SCL_L;                                             
        delay_us(I2C_CYCLE_DELAY_US);                                 
        I2C_DRIVER_SCL_H;                                             
        receive <<= 1;                                                
        if(READ_SDA) receive++;   
        delay_us(I2C_CYCLE_DELAY_US);                                 
    }
    if(ack == 0) I2C_DRIVER_NAck();
    else I2C_DRIVER_Ack();                                             
    return receive;                                                 
}

void I2C_DRIVER_Read_Bytes(u8 SlaveAddress, u8 REG_Address, u8* rec_buffer, u8 len)
{   
    u8 i = 0;
    I2C_DRIVER_Start();   
    I2C_DRIVER_Send_Byte(SlaveAddress); 
    I2C_DRIVER_Wait_Ack(); 
    I2C_DRIVER_Send_Byte(REG_Address);  
    I2C_DRIVER_Wait_Ack(); 
    I2C_DRIVER_Start();
    I2C_DRIVER_Send_Byte(SlaveAddress + 1);
    I2C_DRIVER_Wait_Ack(); 
    for(i = 0; i < len - 1; i++)
    {
        *(rec_buffer + i) = I2C_DRIVER_Read_Byte(1);
    }
    *(rec_buffer + len -1)= I2C_DRIVER_Read_Byte(0);
    I2C_DRIVER_Stop();
}  

void I2C_DRIVER_Write_Bytes(u8 SlaveAddress, u8 REG_Address, u8* REG_data, u8 len)            
{
    u8 i = 0;
    I2C_DRIVER_Start();  
    I2C_DRIVER_Send_Byte(SlaveAddress);  
    I2C_DRIVER_Wait_Ack(); 
    I2C_DRIVER_Send_Byte(REG_Address);        
    I2C_DRIVER_Wait_Ack();    
    for(i = 0; i < len; i++)
    {
        I2C_DRIVER_Send_Byte(*(REG_data + i));
        I2C_DRIVER_Wait_Ack(); 
    }
    I2C_DRIVER_Stop();    
}

void I2C_DRIVER_POC(u8 SlaveAddress, u8 REG_Address, u8* REG_data, u8 len)            
{
    I2C_DRIVER_Start();  
    I2C_DRIVER_Send_Byte(SlaveAddress);  
    I2C_DRIVER_Wait_Ack(); 
    I2C_DRIVER_Send_Byte(REG_Address);        
    I2C_DRIVER_Wait_Ack();    
    I2C_DRIVER_Send_Byte(*(REG_data));
    I2C_DRIVER_Wait_Ack(); 
    I2C_DRIVER_Send_Byte(*(REG_data + 1));
    I2C_DRIVER_Stop();  
}

static void I2C_DRIVER_SDA_OUT(void)
{
    GPIO_InitTypeDef GPIO_InitStructure = {0}; 
    GPIO_InitStructure.Pin = I2C_DRIVER_SDA;
    // 【修改这里】从 PP 改为 OD (开漏输出)
    GPIO_InitStructure.Mode = GPIO_MODE_OUTPUT_OD; 
    GPIO_InitStructure.Pull = GPIO_PULLUP;
    GPIO_InitStructure.Speed = GPIO_SPEED_FREQ_VERY_HIGH;
    HAL_GPIO_Init(GPIO_I2C_DRIVER, &GPIO_InitStructure);
}

static void I2C_DRIVER_SDA_IN(void)
{
    GPIO_InitTypeDef GPIO_InitStructure = {0}; 
    GPIO_InitStructure.Pin = I2C_DRIVER_SDA;
    GPIO_InitStructure.Mode = GPIO_MODE_INPUT;
    GPIO_InitStructure.Pull = GPIO_PULLUP;
    HAL_GPIO_Init(GPIO_I2C_DRIVER, &GPIO_InitStructure); 
}

static void I2C_DRIVER_Start(void)
{
    I2C_DRIVER_SDA_OUT();                                          
    I2C_DRIVER_SDA_H;                                              
    I2C_DRIVER_SCL_H;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SDA_L;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SCL_L;                                              
}

static void I2C_DRIVER_Stop(void)
{
    I2C_DRIVER_SDA_OUT();                                          
    I2C_DRIVER_SCL_L;                                              
    I2C_DRIVER_SDA_L;                                              
    I2C_DRIVER_SCL_H;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SDA_H;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
}

static void I2C_DRIVER_Ack(void)
{
    I2C_DRIVER_SCL_L;                                              
    I2C_DRIVER_SDA_OUT();                                          
    I2C_DRIVER_SDA_L;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SCL_H;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SCL_L;                                              
}

static void I2C_DRIVER_NAck(void)
{
    I2C_DRIVER_SCL_L;                                              
    I2C_DRIVER_SDA_OUT();                                          
    I2C_DRIVER_SDA_H;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SCL_H;                                              
    delay_us(I2C_CYCLE_DELAY_US);                                  
    I2C_DRIVER_SCL_L;                                              
}

static u8 I2C_DRIVER_Wait_Ack(void)
{ 
    u8 tempTime=0;                                                 
    I2C_DRIVER_SCL_H;                                              
    delay_us(I2C_CYCLE_DELAY_US); 
    I2C_DRIVER_SDA_IN();  
    while(READ_SDA)   
    {
        tempTime++;                                          
        if(tempTime > 250) { I2C_DRIVER_Stop(); return 1; }                                                            
    }
    I2C_DRIVER_SCL_L;                                              
    return 0;
}