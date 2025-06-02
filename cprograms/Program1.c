#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

#define MAX_ENTRIES 10000
#define MAX_LINE_LEN 256

typedef struct {
    char msg[20];
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

int main() {
    FILE *file = fopen("input_msg.txt", "r");
    FILE *out = fopen("Finaloutput.txt", "w");

    if (!file || !out) {
        printf("Error opening file!\n");
        return 1;
    }

    CmdEntry *cmd1List = malloc(sizeof(CmdEntry) * MAX_ENTRIES);
    CmdEntry *cmd2List = malloc(sizeof(CmdEntry) * MAX_ENTRIES);
    int l1 = 0, l2 = 0;

    char line[MAX_LINE_LEN];
    char cmd1_input[10], cmd2_input[10];
    CmdEntry current;
    current.msg[0] = '\0';
    current.cmd[0] = '\0';
    current.time = 0;

    printf("Enter CMD1: ");
    scanf("%s", cmd1_input);
    to_uppercase(cmd1_input);

    printf("Enter CMD2: ");
    scanf("%s", cmd2_input);
    to_uppercase(cmd2_input);

    while (fgets(line, sizeof(line), file)) {
        // Check for MSG line
        if (strstr(line, "MSG")) {
            sscanf(line, "MSG #%s", current.msg);
        }

        // CMD line
        if (line_has_cmd(line)) {
            sscanf(line, "%*s %s", current.cmd);
            to_uppercase(current.cmd);
        }

        // TIME line
        if (strstr(line, "TIME")) {
            sscanf(line, "%*s %d", &current.time);

            // After all 3 are set, store entry
            if (strcmp(current.cmd, cmd1_input) == 0 && l1 < MAX_ENTRIES) {
                cmd1List[l1++] = current;
            } else if (strcmp(current.cmd, cmd2_input) == 0 && l2 < MAX_ENTRIES) {
                cmd2List[l2++] = current;
            }

            current.cmd[0] = '\0'; // reset for next message
            current.time = 0;
        }
    }

    int min = l1 < l2 ? l1 : l2;
    for (int i = 0; i < min; i++) {
        int diff = abs(cmd1List[i].time - cmd2List[i].time);
        fprintf(out,"%d\n", diff);
    }

    free(cmd1List);
    free(cmd2List);
    fclose(file);
    fclose(out);

    return 0;
}