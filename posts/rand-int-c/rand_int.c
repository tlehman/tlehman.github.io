#line 25 "index.md"
#include <time.h>
#include <stdlib.h> // rand() is defined here
#include <stdio.h>  // printf() is defined here
#line 46 "index.md"

#line 12 "index.md"
int random_number(int lower, int upper) {
    return (rand() % (upper - lower + 1)) + lower;
}
#line 48 "index.md"

int main() {
    int lower = 42;
    int upper = 75;
#line 35 "index.md"
    int current_time = time(0);
    srand(current_time);
#line 53 "index.md"
    printf(
        "Random number between %d and %d: %d\n",
        lower,
        upper,
        random_number(lower, upper)
    );
    return 0;
}
