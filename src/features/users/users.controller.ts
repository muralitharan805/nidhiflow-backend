import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService, PaginatedUsersResult } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationQueryDto } from '../../core/dto/pagination-query.dto';
import { UserEntity } from './entities/user.entity';

interface RequestWithUser {
  user?: UserEntity;
}

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user domain record' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserEntity,
  })
  create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated collection of users' })
  @ApiResponse({ status: 200, description: 'Paginated user list retrieved' })
  findAll(@Query() query: PaginationQueryDto): Promise<PaginatedUsersResult> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by UUID' })
  @ApiResponse({
    status: 200,
    description: 'User record retrieved',
    type: UserEntity,
  })
  findOne(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<UserEntity> {
    this.checkUserAuthorization(req.user, id);
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update existing user record' })
  @ApiResponse({
    status: 200,
    description: 'User record updated',
    type: UserEntity,
  })
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserEntity> {
    this.checkUserAuthorization(req.user, id);
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete user record by ID' })
  @ApiResponse({ status: 204, description: 'User record deleted' })
  remove(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<void> {
    this.checkUserAuthorization(req.user, id);
    return this.usersService.remove(id);
  }

  private checkUserAuthorization(
    currentUser: UserEntity | undefined,
    targetUserId: string,
  ): void {
    if (
      currentUser &&
      currentUser.role !== Role.ADMIN &&
      currentUser.id !== targetUserId
    ) {
      throw new ForbiddenException(
        'You are not authorized to access or modify another user profile.',
      );
    }
  }
}

