import sys


def show_usage() -> None:
    # 没有传文件路径时，打印简单用法提示
    print("用法：python shiftjis_to_utf8.py 文件1 [文件2 ...]")


def convert_one_file(file_path: str) -> None:
    # 以二进制方式读出原始字节，目的是先看文件头再决定怎么处理
    with open(file_path, "rb") as file:
        raw_bytes = file.read()

    # EF BB BF 是 UTF-8 带 BOM 的文件头，说明已经转换过，直接跳过不重复转换
    if raw_bytes.startswith(b"\xef\xbb\xbf"):
        print(f"跳过（已经是 UTF-8 带 BOM）：{file_path}")
        return

    try:
        # 按日文 Shift-JIS（代码页 cp932）严格解码，解不开会抛异常
        text = raw_bytes.decode("cp932")
    except UnicodeDecodeError:
        # 解码失败说明内容不是 Shift-JIS 文本，直接跳过，避免写坏原文件
        print(f"跳过（不是 Shift-JIS 文本）：{file_path}")
        return

    # 用 utf-8-sig 写回，会自动带上 BOM，记事本就能正常识别
    # newline 传空字符串，保持文件原本的换行符（CRLF）不被改写
    with open(file_path, "w", encoding="utf-8-sig", newline="") as file:
        file.write(text)

    print(f"转换成功：{file_path}")


def main() -> None:
    # 命令行参数去掉脚本名本身，剩下的都是要转换的文件路径
    args = sys.argv[1:]
    if not args:
        # 一个路径都没给时，只提示用法
        show_usage()
        return

    for file_path in args:
        try:
            # 逐个转换传入的文件，单个文件出错不影响后面的文件
            convert_one_file(file_path)
        except FileNotFoundError:
            # 文件不存在时单独提示，不中断整个循环
            print(f"找不到文件：{file_path}")
        except OSError as error:
            # 其余读写错误（权限、占用等）也单独提示原因
            print(f"读写失败：{file_path}，原因：{error}")


if __name__ == "__main__":
    # 脚本被直接运行时才进入转换流程，被 import 时不执行
    main()
