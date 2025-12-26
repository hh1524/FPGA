// Created by: LPham Hoai Luan
// Created on: 2025-04-10
// Description: Test FPGA driver by sending an 8-bit number to FPGA.

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <stdint.h>

#include "./FPGA_Driver.c"

/// Address in Write Channel
#define LED_BASE_PHYS (0x0000000 >> 2)

int main(int argc, char *argv[]) {

    if (argc != 3) {
        fprintf(stderr, "Usage: %s -n <0-255>\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    // Check flag
    if (strcmp(argv[1], "-n") != 0) {
        fprintf(stderr, "Error: Unknown option %s\n", argv[1]);
        fprintf(stderr, "Usage: %s -n <0-255>\n", argv[0]);
        exit(EXIT_FAILURE);
    }

    // Parse number
    int N = atoi(argv[2]);

    if (N < 0 || N > 255) {
        fprintf(stderr, "Error: Value must be 0–255 (8-bit).\n");
        exit(EXIT_FAILURE);
    }

    // Open FPGA
    if (fpga_open() != 1) {
        fprintf(stderr, "Failed to open FPGA device.\n");
        exit(EXIT_FAILURE);
    }

    // Write to FPGA
    *(MY_IP_info.pio_32_mmap + LED_BASE_PHYS) = (uint8_t)N;

    printf("Sent value %d (0x%02X) to FPGA.\n", N, N);

    return 0;
}
