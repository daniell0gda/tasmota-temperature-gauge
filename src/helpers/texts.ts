export class TextsHelper {

    static day(day: number): string {
        if (day > 1 || day === 0) {
            return 'Dni';
        }
        return 'Dzień';
    }
}
