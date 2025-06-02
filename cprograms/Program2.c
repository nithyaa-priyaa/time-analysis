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
   FILE *file = fopen("minorcycleinput.txt", "r");
   FILE *result = fopen("minorcycleoutput.txt", "w");

   FILE *mc[4];
   mc[0] = fopen("mc1.txt", "w");
   mc[1] = fopen("mc2.txt", "w");
   mc[2] = fopen("mc3.txt", "w");
   mc[3] = fopen("mc4.txt", "w");

   if (!file || !result || !mc[0] || !mc[1] || !mc[2] || !mc[3]) {
       fprintf(stderr, "Error opening files!\n");
       return 1;
   }

   CmdEntry *cmd1List = malloc(sizeof(CmdEntry) * MAX_ENTRIES);
   CmdEntry *cmd2List = malloc(sizeof(CmdEntry) * MAX_ENTRIES);
   int l1 = 0, l2 = 0;
   int ct = 0;

   char line[MAX_LINE_LEN];
   char cmd1_input[10];
   CmdEntry current;
   CmdEntry last_non_fba3;
   current.cmd[0] = '\0';
   current.time = 0;
   last_non_fba3.cmd[0] = '\0';
   last_non_fba3.time = 0;

   printf("Enter CMD1: ");
   scanf("%s", cmd1_input);
   to_uppercase(cmd1_input);

   int fba3_block = -1;
   int fba3_index = 0;
   int is_inside_block = 0;
   int seen_first_fba3 = 0;

   while (fgets(line, sizeof(line), file)) {
       trim(line);

       if (line_has_cmd(line)) {
           sscanf(line, "%*s %s", current.cmd);
           to_uppercase(current.cmd);

           if(strcmp(current.cmd, "FBA3") == 0) {
               ct++;
               fba3_block++;
               fba3_index = fba3_block % 4;
               is_inside_block = 1;
           }
       }

       if (strstr(line, "TIME")) {
           sscanf(line, "%*s %d", &current.time);

           if (strcmp(current.cmd, cmd1_input) == 0) {
               if (l1 < MAX_ENTRIES) {
                   cmd1List[l1] = current;
                   l1++;
               }
           }

           if (strcmp(current.cmd, "FBA3") == 0) {
               if (!seen_first_fba3) {
                   seen_first_fba3 = 1;
               } else if (l2 < MAX_ENTRIES) {
                   cmd2List[l2] = last_non_fba3;
                   l2++;
               }
           } else {
               last_non_fba3 = current;
           }

           if (is_inside_block && fba3_block >= 0) {
               fprintf(mc[fba3_index], "%d\n", current.time);
           }

           current.cmd[0] = '\0';
           current.time = 0;
       }
   }

   int min = (l1 < l2) ? l1 : l2;
   for (int i = 0; i < min; i++) {
       int diff = abs(cmd1List[i].time - cmd2List[i].time);
       fprintf(result, "%d\n", diff);
   }

   free(cmd1List);
   free(cmd2List);
   fclose(file);
   fclose(result);
   fclose(mc[0]);
   fclose(mc[1]);
   fclose(mc[2]);
   fclose(mc[3]);

   return 0;
}
