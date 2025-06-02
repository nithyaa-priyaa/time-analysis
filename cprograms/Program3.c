#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_ENTRIES 1000000  // Large value to support many entries
#define MAX_LINE_LEN 256

typedef struct {
    char cmd[10];
    int time;
} CmdEntry;

void to_uppercase(char *str) {
    for (int i = 0; str[i]; i++)
        str[i] = toupper(str[i]);
}

int line_has_cmd(const char *line) {
    return (strstr(line, "CMD") || strstr(line, "Cmd"));
}

void trim(char *str) {
    int i = 0, j = strlen(str) - 1;
    while (isspace((unsigned char)str[i])) i++;
    while (j > i && isspace((unsigned char)str[j])) j--;
    str[j + 1] = '\0';
    memmove(str, str + i, j - i + 2);
}

int main() {
    FILE *file = fopen("cmddiffinput.txt", "r");
    FILE *result = fopen("cmddiffoutput.txt", "w");

    if (!file || !result) {
        fprintf(stderr, "Error opening files!\n");
        return 1;
    }

    CmdEntry *cmdList = malloc(sizeof(CmdEntry) * MAX_ENTRIES);
    int count = 0;
    char line[MAX_LINE_LEN];
    char cmd1_input[10];
    CmdEntry current;
    current.cmd[0] = '\0';
    current.time = 0;

    printf("Enter CMD1: ");
    scanf("%s", cmd1_input);
    to_uppercase(cmd1_input);

    while (fgets(line, sizeof(line), file)) {
        trim(line);
        if (line_has_cmd(line)) {
            sscanf(line, "%*s %s", current.cmd);
            to_uppercase(current.cmd);
        }

        if (strstr(line, "TIME") || strstr(line, "Time")) {
            sscanf(line, "%*s %d", &current.time);

            // Match CMD1
            if (strcmp(current.cmd, cmd1_input) == 0) {
                if (count < MAX_ENTRIES) {
                    cmdList[count++] = current;
                }
            }

            // Clear after TIME processed
            current.cmd[0] = '\0';
            current.time = 0;
        }
    }

    // Compute and write time differences between consecutive CMD1 inputs
    for (int i = 1; i < count; i++) {
        int diff = abs(cmdList[i].time - cmdList[i - 1].time);
        fprintf(result, "%d\n", diff);
    }

    free(cmdList);
    fclose(file);
    fclose(result);
    return 0;
}
