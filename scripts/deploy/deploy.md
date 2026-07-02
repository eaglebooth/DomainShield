# DomainShield Deployment Notes

1. Validate the contract:

```bash
python -c "import ast; ast.parse(open('contracts/DomainShield.py', encoding='utf-8').read())"
python tests/test_contract_static.py
```

2. Deploy in GenLayer Studio or CLI:

```bash
genlayer deploy contracts/DomainShield.py --name DomainShield
```

3. Add the returned address to `frontend/.env.local`:

```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_NETWORK=testnetAsimov
```

4. Run the connected frontend:

```bash
cd frontend
npm install
npm run dev
```
