
import {
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseBigIntPipe
    implements PipeTransform<string, bigint> {
    transform(value: string): bigint {
        if (!/^[1-9]\d*$/.test(value)) {
            throw new BadRequestException(
                'ID must be a positive integer',
            );
        }

        const id = BigInt(value);

        if (id > 9223372036854775807n) {
            throw new BadRequestException('ID is out of range');
        }

        return id;
    }
}
