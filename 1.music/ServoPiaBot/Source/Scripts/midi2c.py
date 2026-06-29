import mido
import os

# =====================================================================
# ⚙️ 核心配置区
# =====================================================================
MIDI_FILENAME = '我的歌声里.mid'  # 你的 MIDI 文件名 (只需写文件名即可)

INPUT_DIR = 'MID'          # MIDI 文件存放的文件夹
OUTPUT_DIR = 'C'           # 生成的 C 代码 txt 文件存放的文件夹

# 你的 0号舵机 对应的是钢琴上的哪个 MIDI 音符？
# 标准 88 键钢琴的中央 C (C4) 是 60。
# 假设你的 0号舵机安装在键盘最左侧的 C2，那么这里填 36。
SERVO_0_MIDI_NOTE = 36  

# =====================================================================

def convert_midi_to_c_array(filename):
    input_path = os.path.join(INPUT_DIR, filename)
    
    if not os.path.exists(input_path):
        print(f"❌ 找不到文件: {input_path}")
        print(f"👉 请确保 {INPUT_DIR} 文件夹存在，且里面有 {filename} 文件。")
        return

    try:
        # clip=True 的意思是：遇到越界的非法数据不报错，强制裁剪到 127 以内
        mid = mido.MidiFile(input_path, clip=True)
    except Exception as e:
        print(f"❌ 解析 MIDI 文件失败: {e}")
        return

    print(f"✅ 成功加载 MIDI 文件: {input_path}")
    print("⏳ 正在将其压缩为单声道 C 语言数组...")

    # 1. 提取所有绝对时间的音符事件
    current_time_ms = 0.0
    events = []
    
    for msg in mid:
        current_time_ms += msg.time * 1000.0  # 转换为毫秒
        if not msg.is_meta:
            if msg.type == 'note_on' and msg.velocity > 0:
                events.append({'type': 'on', 'note': msg.note, 'time': current_time_ms})
            elif msg.type == 'note_off' or (msg.type == 'note_on' and msg.velocity == 0):
                events.append({'type': 'off', 'note': msg.note, 'time': current_time_ms})

    # 2. 匹配按下和抬起，计算每个音符的起始和结束时间
    active_notes = {}
    notes = []
    for ev in events:
        if ev['type'] == 'on':
            if ev['note'] not in active_notes:
                active_notes[ev['note']] = ev['time']
        else:
            if ev['note'] in active_notes:
                start = active_notes.pop(ev['note'])
                notes.append({'note': ev['note'], 'start': start, 'end': ev['time']})
                
    # 按发声顺序排序
    notes.sort(key=lambda x: x['start'])

    if not notes:
        print("❌ 这首 MIDI 里没有检测到音符！")
        return

    # 3. 转换为单片机的 NoteEvent 格式 (处理休止符和重叠音)
    c_array = []
    current_time = 0.0

    for i in range(len(notes)):
        note = notes[i]
        
        # 处理休止符 (如果当前时间离下个音符开始还有一段空白)
        gap = note['start'] - current_time
        if gap > 5.0: # 超过5ms的空白当作休止符
            c_array.append({'note_id': 255, 'duration': 0, 'delay_next': int(gap)})
            current_time = note['start']

        # 确定当前音符能响多久
        next_start = notes[i+1]['start'] if i + 1 < len(notes) else note['end']
        actual_end = min(note['end'], next_start)
        
        duration = actual_end - current_time
        delay_next = next_start - actual_end

        # 映射到舵机 ID
        servo_id = note['note'] - SERVO_0_MIDI_NOTE
        
        # 过滤极短的“幽灵音”
        if duration > 10: 
            if 0 <= servo_id < 64:
                c_array.append({'note_id': servo_id, 'duration': int(duration), 'delay_next': int(delay_next)})
            else:
                # 超出范围用静音代替
                c_array.append({'note_id': 255, 'duration': 0, 'delay_next': int(next_start - current_time)})

        current_time = next_start

    # 4. 生成 C 语言代码字符串
    base_name = os.path.splitext(filename)[0] # 去掉 .mid 后缀
    array_name = "auto_song"
    
    c_code = f"NoteEvent {array_name}[] = {{\n"
    for item in c_array:
        note_str = "休止符" if item['note_id'] == 255 else f"舵机 {item['note_id']}"
        c_code += f"    {{{item['note_id']:>3}, {item['duration']:>4}, {item['delay_next']:>4}}}, // {note_str}\n"
    c_code += "};\n"
    c_code += f"uint16_t song_length = sizeof({array_name}) / sizeof(NoteEvent);\n"

    # 5. 自动保存为 .txt 文件到 C/ 文件夹
    os.makedirs(OUTPUT_DIR, exist_ok=True) # 如果没有 C 文件夹，自动创建
    output_path = os.path.join(OUTPUT_DIR, f"{base_name}.txt")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(c_code)
        
    print("\n" + "="*50)
    print("🎉 转换成功！")
    print(f"📄 代码已自动保存至: {output_path}")
    print("👉 去打开它，Ctrl+A 全选复制，粘贴到 Keil 里吧！")
    print("="*50 + "\n")

if __name__ == "__main__":
    convert_midi_to_c_array(MIDI_FILENAME)