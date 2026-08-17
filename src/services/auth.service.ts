import crypto from "crypto"
import Cliente from "../models/cliente.model.js"
import Profissional from "../models/profissional.model.js"
import type { IForgotPasswordDTO, ILoginDTO, IRegisterDTO, IResetPasswordDTO, UserRole } from "../models/auth.types.js"

const JWT_SECRET = process.env.JWT_SECRET ?? "pet-shop-development-secret"
const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@petshop.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123"
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Administrador"

class AuthService {
    private validateEmail(email: string): boolean {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    public assertPassword(password: string): void {
        if (!password || password.length < 6) {
            throw new Error("A senha deve ter pelo menos 6 caracteres")
        }
    }

    public async hashPassword(password: string): Promise<string> {
        const salt = crypto.randomBytes(16).toString("hex")
        const hash = await new Promise<Buffer>((resolve, reject) => {
            crypto.scrypt(password, salt, 64, (error, derivedKey) => {
                if (error) reject(error)
                resolve(derivedKey)
            })
        })
        return `scrypt:${salt}:${hash.toString("hex")}`
    }

    private async comparePassword(password: string, storedPassword: string): Promise<boolean> {
        const [algorithm, salt, hash] = storedPassword.split(":")

        if (algorithm !== "scrypt" || !salt || !hash) {
            return false
        }

        const derivedHash = await new Promise<Buffer>((resolve, reject) => {
            crypto.scrypt(password, salt, 64, (error, derivedKey) => {
                if (error) reject(error)
                resolve(derivedKey)
            })
        })

        return crypto.timingSafeEqual(Buffer.from(hash, "hex"), derivedHash)
    }

    private base64Url(input: Buffer | string): string {
        return Buffer.from(input).toString("base64url")
    }

    private createToken(payload: Record<string, unknown>): string {
        const header = { alg: "HS256", typ: "JWT" }
        const body = {
            ...payload,
            exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION_SECONDS,
        }
        const unsignedToken = `${this.base64Url(JSON.stringify(header))}.${this.base64Url(JSON.stringify(body))}`
        const signature = crypto.createHmac("sha256", JWT_SECRET).update(unsignedToken).digest("base64url")

        return `${unsignedToken}.${signature}`
    }

    private buildSession(user: { id: string; name: string; email: string; role: UserRole; foto?: string | undefined }) {
        return {
            user,
            token: this.createToken({ sub: user.id, name: user.name, email: user.email, role: user.role }),
        }
    }

    public verifyToken(token: string): { id: string; email: string; name: string; role: UserRole } {
        const [header, payload, signature] = token.split(".")

        if (!header || !payload || !signature) {
            throw new Error("Token inválido")
        }

        const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url")

        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            throw new Error("Token inválido")
        }

        const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
            sub?: string
            email?: string
            name?: string
            role?: UserRole
            exp?: number
        }

        if (!decodedPayload.sub || !decodedPayload.email || !decodedPayload.name || !decodedPayload.exp) {
            throw new Error("Token inválido")
        }

        if (decodedPayload.exp < Math.floor(Date.now() / 1000)) {
            throw new Error("Token expirado")
        }

        return {
            id: decodedPayload.sub,
            email: decodedPayload.email,
            name: decodedPayload.name,
            role: decodedPayload.role ?? "cliente",
        }
    }

    public async register(data: IRegisterDTO) {
        const name = data.name?.trim()
        const email = data.email?.trim().toLowerCase()
        const password = data.password

        if (!name || !email || !password) {
            throw new Error("Nome, e-mail e senha são obrigatórios")
        }

        if (!this.validateEmail(email)) {
            throw new Error("E-mail inválido")
        }

        this.assertPassword(password)

        const emailInUse = await Cliente.findOne({ email })
        const professionalEmailInUse = await Profissional.findOne({ email })

        if (emailInUse || professionalEmailInUse || email === ADMIN_EMAIL) {
            throw new Error("E-mail já cadastrado")
        }

        const clientePayload: Record<string, string> = {
            name,
            email,
            senha: await this.hashPassword(password),
            role: "cliente",
        }

        if (data.telefone?.trim()) clientePayload.telefone = data.telefone.trim()
        if (data.foto?.trim()) clientePayload.foto = data.foto.trim()

        const cliente = await Cliente.create(clientePayload)

        return this.buildSession({ id: cliente.id, name: cliente.name, email: cliente.email, role: "cliente", foto: cliente.foto })
    }

    public async login(data: ILoginDTO) {
        const email = data.email?.trim().toLowerCase()

        if (!email || !data.password) {
            throw new Error("E-mail e senha são obrigatórios")
        }

        if (email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
            return this.buildSession({ id: "admin", name: ADMIN_NAME, email: ADMIN_EMAIL, role: "admin" })
        }

        const profissional = await Profissional.findOne({ email }).select("+senha")

        if (profissional?.senha && (await this.comparePassword(data.password, profissional.senha))) {
            return this.buildSession({ id: profissional.id, name: profissional.name, email: profissional.email, role: "profissional", foto: profissional.foto })
        }

        const cliente = await Cliente.findOne({ email }).select("+senha")

        if (!cliente || !(await this.comparePassword(data.password, cliente.senha))) {
            throw new Error("Credenciais inválidas")
        }

        return this.buildSession({ id: cliente.id, name: cliente.name, email: cliente.email, role: "cliente", foto: cliente.foto })
    }

    public async forgotPassword(data: IForgotPasswordDTO) {
        const email = data.email?.trim().toLowerCase()

        if (!email || !this.validateEmail(email)) {
            throw new Error("E-mail inválido")
        }

        const cliente = await Cliente.findOne({ email })

        if (!cliente) {
            return { message: "Se o e-mail existir, um token de recuperação será gerado" }
        }

        const plainToken = crypto.randomBytes(32).toString("hex")
        const resetPasswordToken = crypto.createHash("sha256").update(plainToken).digest("hex")

        await Cliente.findByIdAndUpdate(cliente.id, {
            resetPasswordToken,
            resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
        })

        return {
            message: "Token de recuperação gerado com sucesso",
            resetToken: plainToken,
        }
    }

    public async resetPassword(data: IResetPasswordDTO) {
        if (!data.token) {
            throw new Error("Token é obrigatório")
        }

        this.assertPassword(data.password)

        const resetPasswordToken = crypto.createHash("sha256").update(data.token).digest("hex")
        const cliente = await Cliente.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: new Date() },
        }).select("+resetPasswordToken +resetPasswordExpires")

        if (!cliente) {
            throw new Error("Token inválido ou expirado")
        }

        await Cliente.findByIdAndUpdate(cliente.id, {
            senha: await this.hashPassword(data.password),
            $unset: {
                resetPasswordToken: "",
                resetPasswordExpires: "",
            },
        })

        return { message: "Senha redefinida com sucesso" }
    }
}

export default new AuthService()
