CREATE OR REPLACE FUNCTION public.fn_prevent_tx_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'DELETE' THEN
        -- Allow admin override if session setting is true
        IF current_setting('app.allow_tx_delete', true) = 'true' THEN
            RETURN OLD;
        END IF;
        RAISE EXCEPTION 'Transaction ledger is append-only: DELETE not allowed';
    END IF;
    IF TG_OP = 'UPDATE' THEN
        IF current_setting('app.allow_tx_delete', true) = 'true' THEN
            RETURN NEW;
        END IF;
        IF OLD.amount != NEW.amount OR OLD.wallet_id != NEW.wallet_id OR OLD.direction != NEW.direction THEN
            RAISE EXCEPTION 'Transaction ledger is immutable: cannot modify amount, wallet, or direction';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
