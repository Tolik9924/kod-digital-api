import UserRepository from "../repositories/userRepository";

const userRepo = new UserRepository();

class UserService {
  async getUser(username: string) {
    const user = await userRepo.getUser(username);
    return user;
  }
}

export default UserService;
