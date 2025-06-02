#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

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

int line_has_cmd(const char *line) {
    return (strstr(line, "CMD") != NULL || strstr(line, "Cmd") != NULL);
}

void trim(char *str) {
    int i = 0, j = (int)strlen(str) - 1;
    while (isspace((unsigned char)str[i])) i++;
    while (j > i && isspace((unsigned char)str[j])) j--;
    str[j + 1] = '\0';
    memmove(str, str + i, j - i + 2);
}

int main() {
    FILE *file = fopen("minorcycleinput.txt", "r");
    FILE *outfile = fopen("cmdmsgoutput.txt", "w");
    if (!file || !outfile) {
        printf("Error opening input or output file!\n");
        if (file) fclose(file);
        if (outfile) fclose(outfile);
        return 1;
    }
    CmdEntry *entries = malloc(sizeof(CmdEntry) * MAX_ENTRIES);
    int entry_count = 0;
    char line[MAX_LINE_LEN];
    CmdEntry current = { "", 0 };

    // Read all CMD and TIME entries from file
    while (fgets(line, sizeof(line), file)) {
        trim(line);
        if (line_has_cmd(line)) {
            sscanf(line, "%*s %s", current.cmd);
            to_uppercase(current.cmd);
        } else if (strncmp(line, "TIME", 4) == 0) {
            sscanf(line, "%*s %d", &current.time);
            if (current.cmd[0] != '\0' && entry_count < MAX_ENTRIES) {
                entries[entry_count++] = current;
            }
            current.cmd[0] = '\0';
            current.time = 0;
        }
    }
    fclose(file);

    if (entry_count == 0) {
        printf("No CMD/TIME entries found in the input file.\n");
        free(entries);
        fclose(outfile);
        return 0;
    }

    int minor_cycle_limit = 0;
    printf("Enter number of minor cycles to process: ");
    if (scanf("%d", &minor_cycle_limit) != 1 || minor_cycle_limit <= 0) {
        printf("Invalid input for minor cycles.\n");
        free(entries);
        fclose(outfile);
        return 1;
    }

    // The first CMD to start a minor cycle is the first CMD in the list
    char minor_cycle_start_cmd[10];
    strcpy(minor_cycle_start_cmd, entries[0].cmd);

    int current_cycle = 1;
    fprintf(outfile, "MINOR CYCLE %d\n", current_cycle);
    fprintf(outfile, "CMD     TIME    TIME DIFFERENCE\n");

    int prev_time = entries[0].time;
    fprintf(outfile, "%-7s %7d %14d\n", entries[0].cmd, entries[0].time, 0);

    for (int i = 1; i < entry_count; i++) {
        // If CMD matches the start CMD, new minor cycle
        if (strcmp(entries[i].cmd, minor_cycle_start_cmd) == 0) {
            current_cycle++;
            if (current_cycle > minor_cycle_limit) {
                break;
            }
            fprintf(outfile, "\n\nMINOR CYCLE %d\n", current_cycle);
            fprintf(outfile, "CMD     TIME    TIME DIFFERENCE\n");
            fprintf(outfile, "%-7s %7d %14d\n", entries[i].cmd, entries[i].time, 0);
            prev_time = entries[i].time;
        } else {
            int diff = abs(entries[i].time - prev_time);
            fprintf(outfile, "%-7s %7d %14d\n", entries[i].cmd, entries[i].time, diff);
            prev_time = entries[i].time;
        }
    }

    printf("Output written to cmdmsgoutput.txt\n");

    free(entries);
    fclose(outfile);
    return 0;
}