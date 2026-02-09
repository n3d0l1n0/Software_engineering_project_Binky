using Microsoft.Extensions.Configuration;
using System.Security.Cryptography;
using System.Text;

namespace MyBackend.Services
{
    public class EncryptionService : IEncryptionService
    {
        private readonly byte[] _key;

        public EncryptionService(IConfiguration configuration)
        {
            var keyString = configuration["EncryptionSettings:EncryptionKey"];
            
            if (string.IsNullOrEmpty(keyString) || keyString.Length != 32)
            {
                throw new InvalidOperationException("EncryptionKey must be 32 characters long and defined in configuration.");
            }
            _key = Encoding.UTF8.GetBytes(keyString);
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return string.Empty;

            using (var aesAlg = Aes.Create()) 
            {
                aesAlg.Key = _key;
                aesAlg.GenerateIV();
                byte[] iv = aesAlg.IV;

                ICryptoTransform encryptor = aesAlg.CreateEncryptor(aesAlg.Key, iv);

                using (MemoryStream msEncrypt = new MemoryStream())
                {
                    msEncrypt.Write(iv, 0, iv.Length);

                    using (CryptoStream csEncrypt = new CryptoStream(msEncrypt, encryptor, CryptoStreamMode.Write))
                    {
                        using (StreamWriter swEncrypt = new StreamWriter(csEncrypt))
                        {
                            swEncrypt.Write(plainText);
                        }
                    }
                    return Convert.ToBase64String(msEncrypt.ToArray());
                }
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return string.Empty;

            byte[] fullCipher = Convert.FromBase64String(cipherText);

            using (var aesAlg = Aes.Create()) 
            {
                aesAlg.Key = _key;

                byte[] iv = new byte[aesAlg.BlockSize / 8];
                Array.Copy(fullCipher, 0, iv, 0, iv.Length);
                
                using (MemoryStream msDecrypt = new MemoryStream())
                {
                    msDecrypt.Write(fullCipher, iv.Length, fullCipher.Length - iv.Length);
                    msDecrypt.Seek(0, SeekOrigin.Begin);

                    ICryptoTransform decryptor = aesAlg.CreateDecryptor(aesAlg.Key, iv);

                    using (CryptoStream csDecrypt = new CryptoStream(msDecrypt, decryptor, CryptoStreamMode.Read))
                    {
                        using (StreamReader srDecrypt = new StreamReader(csDecrypt))
                        {
                            return srDecrypt.ReadToEnd();
                        }
                    }
                }
            }
        }
    }
}
