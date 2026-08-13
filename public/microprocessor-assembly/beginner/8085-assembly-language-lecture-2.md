# 8085 Assembly Language --- Lecture 2 Learning Notes

## 1. What is Assembly Language?

A microprocessor understands **machine language**: patterns of `0`s and
`1`s.

For example:

``` text
00111100
```

For an 8085 processor, this binary pattern represents the instruction:

``` text
INR A
```

Writing long binary patterns is difficult for humans. Hexadecimal is
easier, but it is still not very readable.

So, assembly language uses **short symbolic names called mnemonics**.

Example:

``` text
INR A
ADD B
```

These are much easier for a programmer to understand.

> **Simple idea:** Assembly language is a human-readable way of writing
> instructions for a particular microprocessor.

------------------------------------------------------------------------

## 2. Machine Language vs Assembly Language

  -----------------------------------------------------------------------
  Machine Language                    Assembly Language
  ----------------------------------- -----------------------------------
  Uses binary/bit patterns            Uses mnemonics

  Difficult for humans to read        Easier to read

  Directly understood by the          Must be translated into machine
  processor                           language

  Example: `00111100`                 Example: `INR A`
  -----------------------------------------------------------------------

The lecture gives this example:

``` text
00111100 → 3C → INR A
```

So:

-   `00111100` = binary machine code
-   `3C` = hexadecimal representation
-   `INR A` = assembly-language mnemonic

------------------------------------------------------------------------

## 3. What is a Mnemonic?

A **mnemonic** is a short symbolic name that suggests what an
instruction does.

Examples:

``` text
INR A
ADD B
```

### INR A

`INR` means increment register.

So:

``` text
INR A
```

means:

> Increase the value in accumulator A by 1.

### ADD B

``` text
ADD B
```

means:

> Add the contents of register B to the accumulator.

The result remains in the accumulator.

------------------------------------------------------------------------

## 4. Assembly Language is Machine Dependent

This is very important for exams.

8085 assembly language is designed for the **8085 instruction set**.

A program written for the 8085 cannot simply be executed on a different
processor such as the Motorola 6800.

Why?

Because different processors have different:

-   instruction sets
-   machine codes
-   mnemonics
-   processor architectures

Therefore:

> **Assembly language is machine dependent.**

------------------------------------------------------------------------

# 5. How Assembly Language Becomes Machine Language

There are two methods mentioned in the lecture.

## Method 1: Hand Assembly

The programmer manually converts assembly instructions into their
hexadecimal machine codes.

For example:

``` text
INR A
```

is converted into:

``` text
3C
```

Then the hexadecimal code is entered into memory.

This is possible, but it is difficult and error-prone for large
programs.

------------------------------------------------------------------------

## Method 2: Assembler

An **assembler** is a program that automatically translates
assembly-language instructions into machine language.

Conceptually:

``` text
Assembly Program
       ↓
   Assembler
       ↓
Machine Language
       ↓
8085 executes it
```

### Remember

**Assembler = Assembly language → Machine language**

------------------------------------------------------------------------

# 6. Instruction and Operand

An 8085 instruction can be understood as having two main parts:

``` text
OPCODE + OPERAND
```

## Opcode

The **opcode** tells the processor **what operation to perform**.

Examples:

``` text
MOV
ADD
SUB
MVI
JMP
```

## Operand

The **operand** tells the processor **what data/register/address the
operation works on**.

Example:

``` text
ADD B
```

Here:

-   `ADD` = opcode
-   `B` = operand

Another example:

``` text
MVI A, 25H
```

Here:

-   `MVI` = operation/opcode
-   `A` = destination register
-   `25H` = immediate data

The lecture notes that instructions can have different operand forms,
including no operand, 8-bit immediate data, a register, or a 16-bit
memory address.

------------------------------------------------------------------------

# 7. The Accumulator --- A Very Important Register

The **Accumulator (A)** is an 8-bit register used heavily in 8085
arithmetic and logical operations.

For example:

``` text
MVI A, 05H
MVI B, 03H
ADD B
```

Step by step:

``` text
A = 05H
B = 03H
```

Then:

``` text
ADD B
```

performs:

``` text
A = A + B
A = 05H + 03H
A = 08H
```

So the final result is in **A**.

------------------------------------------------------------------------

# 8. Common 8085 Instructions You Should Recognize

## Data Transfer

These instructions move/copy data.

### MOV

``` text
MOV B, A
```

Meaning:

> Copy the contents of A into B.

The original value in A is not changed.

### MVI

``` text
MVI A, 25H
```

Meaning:

> Put the immediate value `25H` into A.

### LDA

``` text
LDA 2000H
```

Meaning:

> Load the accumulator with the contents of memory location `2000H`.

### STA

``` text
STA 2000H
```

Meaning:

> Store the accumulator's contents into memory location `2000H`.

------------------------------------------------------------------------

# 9. Arithmetic Instructions

## ADD

``` text
ADD B
```

Meaning:

``` text
A = A + B
```

## ADI

``` text
ADI 05H
```

Meaning:

``` text
A = A + 05H
```

The number `05H` is immediate data.

## SUB

``` text
SUB B
```

Meaning:

``` text
A = A - B
```

## SUI

``` text
SUI 03H
```

Meaning:

``` text
A = A - 03H
```

## INR

``` text
INR B
```

Meaning:

``` text
B = B + 1
```

## DCR

``` text
DCR B
```

Meaning:

``` text
B = B - 1
```

------------------------------------------------------------------------

# 10. Logical Instructions

8085 provides logical operations such as AND, OR and XOR.

## ANA

``` text
ANA B
```

Meaning:

``` text
A = A AND B
```

## ANI

``` text
ANI 0FH
```

Meaning:

``` text
A = A AND 0FH
```

## ORA

``` text
ORA B
```

Meaning:

``` text
A = A OR B
```

## XRA

``` text
XRA B
```

Meaning:

``` text
A = A XOR B
```

## CMA

``` text
CMA
```

Meaning:

> Take the 1's complement of the accumulator.

CMA has **no operand**.

------------------------------------------------------------------------

# 11. Branch Instructions

Branch instructions change the normal sequence of execution.

## JMP

``` text
JMP 2050H
```

Meaning:

> Go to memory address `2050H`.

## Conditional Jump

A conditional jump happens only when a particular condition is true.

Examples:

``` text
JZ 2050H
JNZ 2050H
JC 2050H
JNC 2050H
JP 2050H
JM 2050H
```

Important meanings:

  Instruction   Meaning
  ------------- -------------------------------
  JZ            Jump if Zero flag is set
  JNZ           Jump if Zero flag is not set
  JC            Jump if Carry flag is set
  JNC           Jump if Carry flag is not set
  JP            Jump if Sign flag is not set
  JM            Jump if Sign flag is set

------------------------------------------------------------------------

# 12. CALL and RET

These are used for subroutines.

``` text
CALL 3000H
```

means:

> Go to address `3000H` and treat that location as a subroutine.

``` text
RET
```

means:

> Return from the subroutine.

Simple picture:

``` text
Main Program
     |
    CALL
     ↓
Subroutine
     |
    RET
     ↓
Main Program continues
```

------------------------------------------------------------------------

# 13. Machine-Control Instructions

## HLT

``` text
HLT
```

Meaning:

> Stop executing the program.

## NOP

``` text
NOP
```

Meaning:

> No operation; do nothing.

NOP can also be useful for creating delays or replacing instructions
during debugging.

------------------------------------------------------------------------

# 14. Four 8085 Addressing Modes

An **addressing mode** tells us how the instruction specifies its
operand/data.

The lecture identifies four 8085 addressing modes.

## 1. Implied Addressing

The operand is understood automatically.

Example:

``` text
CMA
```

There is no operand written.

The instruction automatically operates on the accumulator.

------------------------------------------------------------------------

## 2. Immediate Addressing

The actual data is written inside the instruction.

Example:

``` text
MVI B, 45H
```

Here:

``` text
45H
```

is the actual data.

Another example:

``` text
ADI 05H
```

The value `05H` is supplied directly to the instruction.

### Easy memory trick

**Immediate = data is immediately present in the instruction.**

------------------------------------------------------------------------

## 3. Direct Addressing

The instruction contains the memory address of the data.

Example:

``` text
LDA 4000H
```

Meaning:

> Get the data from memory address `4000H` and put it into A.

Here `4000H` is the actual memory address.

### Easy memory trick

**Direct = instruction directly gives the memory address.**

------------------------------------------------------------------------

## 4. Indirect Addressing

The instruction does not directly contain the memory address.

Instead, a register pair contains the address.

Example:

``` text
LDAX B
```

Here the BC register pair contains the 16-bit memory address.

The processor accesses the memory location whose address is stored in BC
and loads its contents into A.

### Easy memory trick

**Indirect = address is found through a register pair.**

------------------------------------------------------------------------

# 15. Direct vs Indirect --- Important Difference

Suppose memory address `4000H` contains `25H`.

### Direct

``` text
LDA 4000H
```

The instruction itself says:

``` text
Go to 4000H
```

### Indirect

Suppose:

``` text
BC = 4000H
```

Then:

``` text
LDAX B
```

means:

``` text
Use BC as the address
       ↓
   4000H
       ↓
Read memory
       ↓
Put data into A
```

So:

``` text
Direct   → address is written in instruction
Indirect → address is stored in register pair
```

------------------------------------------------------------------------

# 16. Instruction Size

Instructions do not all occupy the same number of memory bytes.

According to the lecture:

### 1-byte instruction

Usually an instruction with no additional data/address.

Example:

``` text
INR A
```

### 2-byte instruction

An instruction containing 8-bit immediate data.

Example:

``` text
MVI A, 32H
```

Conceptually:

``` text
Byte 1 → opcode
Byte 2 → 8-bit data
```

### 3-byte instruction

An instruction containing a 16-bit memory address.

Example:

``` text
JMP 2085H
```

Conceptually:

``` text
Byte 1 → opcode
Byte 2 → lower 8 bits of address
Byte 3 → upper 8 bits of address
```

The lecture's example gives:

``` text
JMP 2085H

C3 85 20
```

Notice that the 16-bit address is stored as:

``` text
85 20
```

------------------------------------------------------------------------

# 17. Simple Assembly Program

## Problem

Load `25H` into A and copy it to B.

### Assembly

``` text
MVI A, 25H
MOV B, A
HLT
```

### Step-by-step

Initially:

``` text
A = unknown
B = unknown
```

After:

``` text
MVI A, 25H
```

we have:

``` text
A = 25H
```

Then:

``` text
MOV B, A
```

gives:

``` text
B = 25H
```

Finally:

``` text
HLT
```

stops execution.

------------------------------------------------------------------------

# 18. Assembly and C --- How to Think About Them Together

The practice material gives assembly examples alongside equivalent C
code.

For example:

### Assembly

``` text
MVI A, 25H
MOV B, A
```

### Similar C idea

``` c
A = 0x25;
B = A;
```

Another example:

### Assembly

``` text
MVI A, 09H
MVI B, 04H
SUB B
```

### Similar C idea

``` c
A = 9;
B = 4;
A = A - B;
```

The C code is useful for understanding the **logic**, but remember:

> C and 8085 assembly are not the same language.

C is a high-level language, while assembly is much closer to the
processor's instruction set.

------------------------------------------------------------------------

# 19. Loop Example --- Very Important

The practice material uses this pattern:

``` text
MVI C, 05H

LOOP: DCR C
      JNZ LOOP

HLT
```

Let's understand it like a programming-language loop.

Initial:

``` text
C = 5
```

Iteration 1:

``` text
C = 4
```

Since C ≠ 0:

``` text
JNZ LOOP
```

goes back.

Then:

``` text
C = 3
C = 2
C = 1
C = 0
```

When C becomes zero, the Zero flag is set, so:

``` text
JNZ LOOP
```

does not jump.

The program reaches:

``` text
HLT
```

### Similar C idea

``` c
int C = 5;

while (C != 0) {
    C--;
}
```

This is one of the most useful connections between your
programming-language foundation and 8085 assembly.

------------------------------------------------------------------------

# 20. How to Read an Assembly Program

Whenever you see an 8085 program, read it line by line.

For each instruction ask:

### Question 1

**What operation is being performed?**

Example:

``` text
ADD B
```

→ addition.

### Question 2

**Where is the input?**

For:

``` text
ADD B
```

inputs are:

``` text
A and B
```

### Question 3

**Where does the result go?**

For:

``` text
ADD B
```

result goes to:

``` text
A
```

### Question 4

**Does it change flags?**

This matters especially for:

``` text
CMP
DCR
INR
ADD
SUB
```

and conditional jumps.

------------------------------------------------------------------------

# 21. A Small Cheat Sheet

  Instruction   Simple meaning
  ------------- ---------------------
  MOV B,A       Copy A → B
  MVI A,25H     Put 25H → A
  LDA 2000H     Memory\[2000H\] → A
  STA 2000H     A → Memory\[2000H\]
  ADD B         A = A + B
  ADI 05H       A = A + 05H
  SUB B         A = A − B
  SUI 05H       A = A − 05H
  INR B         B = B + 1
  DCR B         B = B − 1
  ANA B         A = A AND B
  ORA B         A = A OR B
  XRA B         A = A XOR B
  CMA           Complement A
  JMP addr      Unconditional jump
  JZ addr       Jump if zero
  JNZ addr      Jump if not zero
  JC addr       Jump if carry
  JNC addr      Jump if no carry
  CALL addr     Call subroutine
  RET           Return
  HLT           Stop
  NOP           Do nothing

------------------------------------------------------------------------

# 22. Exam-Focused Points to Memorize

### Assembly Language

-   Assembly language uses **mnemonics** instead of binary machine
    codes.
-   It is **machine dependent**.
-   An **assembler** translates assembly language into machine language.
-   The 8085 instruction consists conceptually of an **opcode and
    operand**.
-   The accumulator is heavily used in arithmetic and logical
    operations.

### Addressing Modes

Remember these four:

``` text
I I D I
```

-   **Implied**
-   **Immediate**
-   **Direct**
-   **Indirect**

Examples:

``` text
CMA          → Implied
MVI B,45H    → Immediate
LDA 4000H    → Direct
LDAX B       → Indirect
```

### Instruction Size

``` text
No immediate/address → usually 1 byte
8-bit immediate      → 2 bytes
16-bit address       → 3 bytes
```

### Loops

The basic 8085 loop pattern is:

``` text
DCR counter
JNZ LOOP
```

Think:

``` text
Decrease → Check Zero → Repeat
```

------------------------------------------------------------------------

# 23. Final Mental Model

Think of 8085 assembly programming like giving very small, precise
instructions to the processor.

For example:

``` text
MVI A, 05H    ; Put 5 in A
MVI B, 03H    ; Put 3 in B
ADD B         ; A = A + B
HLT           ; Stop
```

In programming-language terms, you can mentally translate it as:

``` text
A = 5;
B = 3;
A = A + B;
stop;
```

The important difference is that assembly exposes much more of what the
processor is actually doing.

## The big picture

``` text
Problem
   ↓
Assembly instructions
   ↓
Assembler
   ↓
Machine code
   ↓
8085 fetches instruction
   ↓
Decodes instruction
   ↓
Executes instruction
```

If you understand this flow, the rest of 8085 assembly becomes much
easier.
