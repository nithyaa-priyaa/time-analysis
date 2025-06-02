#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_CMDS 50
#define MAX_ENTRIES 10000
#define MAX_LINE_LEN 256

typedef struct {
    char cmd[10];
    int time;
} CmdEntry;

void to_uppercase(char *str) {
    for (int i = 0; str[i]; i++)
        str[i] = toupper((unsigned char)str[i]);
}

int is_cmd_line(char *line) {
    return strstr(line, "CMD") != NULL || strstr(line, "Cmd") != NULL;
}

int is_time_line(char *line) {
    return strstr(line, "TIME") != NULL || strstr(line, "Time") != NULL;
}

void trim(char *str) {
    int i = 0;
    while (isspace(str[i])) i++;
    int j = strlen(str) - 1;
    while (j > i && isspace(str[j])) j--;
    str[j + 1] = '\0';
    memmove(str, str + i, j - i + 2);
}

void process_cmd(char *target_cmd, FILE *file) {
    CmdEntry entries[MAX_ENTRIES];
    int count = 0;
    char line[MAX_LINE_LEN];
    char current_cmd[10] = "";
    int current_time = 0;

    rewind(file);  // Reset file pointer

    while (fgets(line, sizeof(line), file)) {
        trim(line);

        if (is_cmd_line(line)) {
            sscanf(line, "%*s %s", current_cmd);  // Read the CMD word
            to_uppercase(current_cmd);
        }

        if (is_time_line(line)) {
            sscanf(line, "%*s %d", &current_time);

            if (strcmp(current_cmd, target_cmd) == 0) {
                if (count < MAX_ENTRIES) {
                    strcpy(entries[count].cmd, current_cmd);
                    entries[count].time = current_time;
                    count++;
                }
            }

            current_cmd[0] = '\0';
        }
    }

    if (count < 2) return;

    // Save differences to CMD.txt
    char filename[20];
    snprintf(filename, sizeof(filename), "%s.txt", target_cmd);
    FILE *out = fopen(filename, "w");
    if (!out) {
        printf("Error opening %s for writing.\n", filename);
        return;
    }

    for (int i = 1; i < count; i++) {
        int diff = abs(entries[i].time - entries[i - 1].time);
        fprintf(out, "%d\n", diff);
    }

    fclose(out);
    printf("Saved %s\n", filename);
}

int main() {
    FILE *file = fopen("mulcmdtime.txt", "r");
    if (!file) {
        printf("Error: Cannot open input file!\n");
        return 1;
    }

    char input[500];
    char *cmds[MAX_CMDS];
    int cmd_count = 0;

    printf("Enter CMDs (comma or space separated): ");
    fgets(input, sizeof(input), stdin);
    trim(input);

    // Tokenize input safely by comma and space
    char *token = strtok(input, ", ");
    while (token && cmd_count < MAX_CMDS) {
        trim(token);
        if (strlen(token) == 0 || !isalnum(token[0])) {
            token = strtok(NULL, ", ");
            continue;
        }
        cmds[cmd_count] = malloc(strlen(token) + 1);
        strcpy(cmds[cmd_count], token);
        to_uppercase(cmds[cmd_count]);
        cmd_count++;
        token = strtok(NULL, ", ");
    }

    for (int i = 0; i < cmd_count; i++) {
        process_cmd(cmds[i], file);
        free(cmds[i]);
    }

    fclose(file);
    return 0;
}